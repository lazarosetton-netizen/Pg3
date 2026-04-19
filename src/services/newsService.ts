import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Persistent cache using localStorage
const CACHE_KEY = "pgnews_cache";
const CACHE_TIME_KEY = "pgnews_cache_time";
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

const getCachedNews = (): NewsItem[] => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
    if (cached && cacheTime && Date.now() - Number(cacheTime) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error("Error reading cache", e);
  }
  return [];
};

const setCachedNews = (news: NewsItem[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(news));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
    console.error("Error setting cache", e);
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const NEWS_SITES = [
  "timesofisrael.com",
  "ynetnews.com",
  "i24news.tv"
];

export async function fetchNews(beforeDate?: string, retryCount = 0, forceRefresh = false): Promise<NewsItem[]> {
  // Use persistent cache if available
  if (!forceRefresh && !beforeDate) {
    const cached = getCachedNews();
    if (cached.length > 0) return cached;
  }

  const now = new Date().toLocaleString("pt-BR", { timeZone: "Israel" });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `DATA/HORA ISRAEL: ${now}.
      ${beforeDate ? `NOTÍCIAS ANTES DE: ${beforeDate}.` : "Pesquise as 5 notícias mais RECENTES e de ÚLTIMA HORA (BREAKING NEWS) publicadas nos ÚLTIMOS MINUTOS"} sobre Israel nos sites: ${NEWS_SITES.join(", ")}. 
      Priorize fatos ocorridos agora ou há pouquíssimo tempo.
      Para cada uma:
      1. Tradução detalhada (PT-BR).
      2. Resumo.
      3. URL original.
      4. Data/Hora (DD/MM/AAAA HH:MM).
      5. Comentário geopolítico PRÓ-ISRAEL (soberania) com LÓGICA e FATOS.
      6. Fonte.
      7. ID (hash URL).
      Retorne JSON (array).`,
      config: {
        tools: [{ googleSearch: {} }],
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
    
    if (!beforeDate && news.length > 0) {
      setCachedNews(news);
    }
    
    return news;
  } catch (error: any) {
    console.error(`Error fetching news (attempt ${retryCount + 1}):`, error);
    
    const isRateLimit = error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("quota");
    
    if (isRateLimit && retryCount < 2) {
      await sleep(Math.pow(2, retryCount) * 3000);
      return fetchNews(beforeDate, retryCount + 1);
    }
    
    if (isRateLimit) {
      const cached = getCachedNews();
      if (cached.length > 0) return cached;
      throw new Error("LIMITE_EXCEDIDO: Tente novamente em instantes.");
    }
    
    throw error;
  }
}
