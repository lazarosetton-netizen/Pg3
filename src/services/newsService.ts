import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory cache to prevent hitting rate limits
let newsCache: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const NEWS_SITES = [
  "https://www.timesofisrael.com/",
  "https://www.ynet.co.il",
  "https://www.c14.co.il/",
  "https://www.i24news.tv/en",
  "https://www.kan.org.il/",
  "https://13tv.co.il/"
];

export async function fetchNews(beforeDate?: string, retryCount = 0, forceRefresh = false): Promise<NewsItem[]> {
  // If not a "load more" request and we have fresh cache, return it
  if (!forceRefresh && !beforeDate && newsCache.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
    return newsCache;
  }

  const now = new Date().toLocaleString("pt-BR", { timeZone: "Israel" });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `DATA/HORA ISRAEL: ${now}.
      ${beforeDate ? `NOTÍCIAS ANTES DE: ${beforeDate}.` : "Pesquise as 5 notícias mais recentes (BREAKING NEWS)"} sobre Israel/Oriente Médio e conflitos geopolíticos nos sites: ${NEWS_SITES.join(", ")}. 
      Para cada uma:
      1. Tradução detalhada para português.
      2. Resumo impactante.
      3. URL original.
      4. Data/Hora publicação (DD/MM/AAAA HH:MM).
      5. Comentário geopolítico PROFUNDO e PRÓ-ISRAEL (soberania de Israel) usando LÓGICA, DADOS e FATOS HISTÓRICOS.
      6. Fonte.
      7. ID único (hash URL).
      Retorne JSON (array de objetos), ordenado por data decrescente.`,
    config: {
      tools: [{ googleSearch: {} }, { urlContext: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            fullText: { type: Type.STRING },
            commentary: { type: Type.STRING },
            date: { type: Type.STRING },
            time: { type: Type.STRING },
            originalUrl: { type: Type.STRING },
            source: { type: Type.STRING },
          },
          required: ["id", "title", "summary", "fullText", "commentary", "date", "time", "originalUrl", "source"],
        },
      },
    },
  });

    const news = JSON.parse(response.text || "[]") as NewsItem[];
    
    // Update cache only for the main feed (not "load more")
    if (!beforeDate && news.length > 0) {
      newsCache = news;
      lastFetchTime = Date.now();
    }
    
    return news;
  } catch (error: any) {
    console.error(`Error fetching news (attempt ${retryCount + 1}):`, error);
    
    // Specifically handle rate limit errors (429)
    const isRateLimit = error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("quota");
    
    if (isRateLimit && retryCount < 3) {
      // Exponential backoff: 5s, 10s, 20s
      const waitTime = Math.pow(2, retryCount) * 5000;
      await sleep(waitTime);
      return fetchNews(beforeDate, retryCount + 1);
    }
    
    if (isRateLimit) {
      // If we have stale cache, return it instead of throwing
      if (newsCache.length > 0) {
        console.warn("Rate limit hit, returning stale cache.");
        return newsCache;
      }
      throw new Error("LIMITE_EXCEDIDO: O sistema está processando muitas requisições. Aguarde um momento.");
    }
    
    throw error;
  }
}
