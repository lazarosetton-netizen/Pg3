import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory cache to prevent hitting rate limits
let newsCache: NewsItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const NEWS_SITES = [
  "https://www.timesofisrael.com/",
  "https://www.ynet.co.il",
  "https://www.c14.co.il/",
  "https://www.i24news.tv/en",
  "https://www.kan.org.il/",
  "https://13tv.co.il/"
];

export async function fetchNews(beforeDate?: string, retryCount = 0): Promise<NewsItem[]> {
  // If not a "load more" request and we have fresh cache, return it
  if (!beforeDate && newsCache.length > 0 && Date.now() - lastFetchTime < CACHE_DURATION) {
    return newsCache;
  }

  const now = new Date().toLocaleString("pt-BR", { timeZone: "Israel" });
  
  try {
    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `DATA E HORA ATUAL EM ISRAEL: ${now}.
      ${beforeDate ? `BUSQUE NOTÍCIAS PUBLICADAS ANTES DE: ${beforeDate}.` : "Pesquise as 10 notícias mais recentes e de ÚLTIMA HORA (BREAKING NEWS)"} sobre Israel e o Oriente Médio, a situação geopolítica na região e os conflitos, baseando-se nos seguintes sites: ${NEWS_SITES.join(", ")}. 
    ${beforeDate ? "Foque em notícias históricas ou ligeiramente mais antigas que a data fornecida." : "Priorize notícias publicadas nos últimos minutos ou horas."}
    Para cada notícia, você deve:
    1. Traduzir o título e o texto completo para o português de forma detalhada.
    2. Fornecer um resumo curto e impactante.
    3. Extrair a URL original exata da notícia.
    4. Adicionar a data e a hora exata da publicação (formato DD/MM/AAAA HH:MM).
    5. Adicionar um comentário geopolítico e histórico PROFUNDO e PRÓ-ISRAEL, em favor da soberania do Estado de Israel. Este comentário deve explicar o artigo publicado usando estritamente LÓGICA, DADOS, NÚMEROS e FATOS HISTÓRICOS INCONTESTÁVEIS. O objetivo é fornecer uma defesa intelectual e factual da posição israelense.
    6. Identificar a fonte (nome do site).
    7. Gerar um ID único e estável baseado em um hash curto da URL original.
    Retorne os dados em formato JSON, ordenados pela notícia mais recente primeiro.`,
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
    if (!beforeDate) {
      newsCache = news;
      lastFetchTime = Date.now();
    }
    
    return news;
  } catch (error: any) {
    console.error(`Error fetching news (attempt ${retryCount + 1}):`, error);
    
    // Specifically handle rate limit errors (429)
    const isRateLimit = error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("429") || error?.message?.includes("quota");
    
    if (isRateLimit && retryCount < 3) {
      // Exponential backoff: 2s, 4s, 8s
      const waitTime = Math.pow(2, retryCount + 1) * 1000;
      await sleep(waitTime);
      return fetchNews(beforeDate, retryCount + 1);
    }
    
    if (isRateLimit) {
      throw new Error("LIMITE_EXCEDIDO: O sistema está processando muitas requisições no momento. Por favor, aguarde um minuto e tente novamente.");
    }
    
    throw error;
  }
}
