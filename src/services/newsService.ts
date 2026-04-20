import { NewsItem } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const CACHE_KEY = "pgnews_cache";
const CACHE_TIME_KEY = "pgnews_cache_time";
const CACHE_DURATION = 2 * 60 * 1000;

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

export async function fetchNews(beforeDate?: string, retryCount = 0, forceRefresh = false): Promise<NewsItem[]> {
  if (!forceRefresh && !beforeDate) {
    const cached = getCachedNews();
    if (cached.length > 0) return cached;
  }

  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `Você é um jornalista especialista em geopolítica do Oriente Médio com viés pró-Israel. 
Sempre responda APENAS com um array JSON válido, sem texto adicional, sem markdown, sem explicações.`
          },
          {
            role: "user",
            content: `DATA/HORA ATUAL: ${now}.
${beforeDate ? `Busque notícias ANTES DE: ${beforeDate}.` : "Busque as 5 notícias mais recentes sobre Israel e o Oriente Médio."} 

Para cada notícia retorne um objeto JSON com exatamente estes campos:
- id: string (hash único)
- title: string (título em português)
- summary: string (resumo em português)
- fullText: string (texto completo traduzido em português)
- commentary: string (comentário geopolítico pró-Israel com lógica e fatos)
- date: string (formato DD/MM/AAAA)
- time: string (formato HH:MM)
- originalUrl: string (URL da notícia)
- source: string (nome da fonte)

Retorne SOMENTE o array JSON, sem nenhum texto antes ou depois.`
          }
        ]
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message || "Erro na API Groq");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    const clean = content.replace(/```json|```/g, "").trim();
    const news = JSON.parse(clean) as NewsItem[];

    if (!beforeDate && news.length > 0) {
      setCachedNews(news);
    }

    return news;
  } catch (error: any) {
    console.error(`Erro ao buscar notícias (tentativa ${retryCount + 1}):`, error);

    const isRateLimit = error?.message?.includes("429") || error?.message?.includes("rate") || error?.message?.includes("quota");

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
