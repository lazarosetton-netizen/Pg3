import { NewsItem } from "../types";

const NEWS_API_KEY = "07a9a5c1b570401b87732f30e230e55e";
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

export async function fetchNews(beforeDate?: string, retryCount = 0, forceRefresh = false): Promise<NewsItem[]> {
  if (!forceRefresh && !beforeDate) {
    const cached = getCachedNews();
    if (cached.length > 0) return cached;
  }

  try {
    const url = "https://newsapi.org/v2/everything?q=Israel&language=en&sortBy=publishedAt&pageSize=10&apiKey=" + NEWS_API_KEY;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "ok") {
      throw new Error(data.message || "Erro ao buscar noticias");
    }

    const news: NewsItem[] = data.articles.map((article: any, index: number) => {
      const publishedAt = new Date(article.publishedAt);
      const date = publishedAt.toLocaleDateString("pt-BR");
      const time = publishedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      return {
        id: article.url,
        title: article.title || "Sem titulo",
        summary: article.description || "Sem resumo disponivel",
        fullText: article.content || article.description || "Sem conteudo disponivel",
        commentary: "Israel continua exercendo seu direito de soberania e autodeterminacao como nacao democratica no Oriente Medio.",
        date: date,
        time: time,
        originalUrl: article.url,
        source: article.source?.name || "Desconhecido",
      };
    });

    if (!beforeDate && news.length > 0) {
      setCachedNews(news);
    }

    return news;
  } catch (error: any) {
    console.error("Erro ao buscar noticias:", error);
    const cached = getCachedNews();
    if (cached.length > 0) return cached;
    throw new Error("Erro ao carregar noticias. Tente novamente.");
  }
}
