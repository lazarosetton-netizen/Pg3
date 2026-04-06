import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Search, Newspaper, ChevronDown, Info } from "lucide-react";
import { NewsCard } from "../components/NewsCard";
import { fetchNews } from "../services/newsService";
import { NewsItem } from "../types";

export function HomePage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadNews = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const data = await fetchNews();
      setNews(data);
    } catch (err: any) {
      console.error("Failed to fetch news:", err);
      setError(err.message || "Ocorreu um erro ao carregar as notícias.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreNews = async () => {
    if (loadingMore || news.length === 0) return;
    setLoadingMore(true);
    
    try {
      const lastItem = news[news.length - 1];
      const beforeDate = `${lastItem.date} ${lastItem.time}`;
      const olderNews = await fetchNews(beforeDate);
      
      // Filter out duplicates just in case
      const filteredOlderNews = olderNews.filter(
        older => !news.some(existing => existing.id === older.id)
      );
      
      setNews(prev => [...prev, ...filteredOlderNews]);
    } catch (error) {
      console.error("Failed to fetch more news:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Refresh on scroll up (simplified for web)
    if (scrollTop < -50 && !refreshing) {
      loadNews(true);
    }
    
    // Load more on scroll down
    if (scrollHeight - scrollTop <= clientHeight + 200 && !loadingMore && !loading) {
      loadMoreNews();
    }
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-auto bg-blue-50/30 font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Newspaper className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tighter">PGNEWS</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => loadNews(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={20} />
          </button>
          <div className="hidden md:flex items-center bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 gap-2">
            <Search size={16} className="text-blue-400" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="bg-transparent border-none outline-none text-sm text-blue-900 placeholder:text-blue-300 w-48"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Refresh Indicator */}
        <AnimatePresence>
          {refreshing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 40, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-center text-blue-600 font-medium text-sm mb-4"
            >
              <RefreshCw size={16} className="animate-spin mr-2" />
              Atualizando notícias...
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-blue-50" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 rounded-3xl border border-red-100 px-6 text-center">
            <Info size={48} className="mb-4" />
            <p className="text-lg font-bold mb-2">Ops! Algo deu errado</p>
            <p className="text-sm text-red-400 max-w-md mb-6">
              {error}
            </p>
            <button 
              onClick={() => loadNews()}
              className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              Tentar novamente
            </button>
          </div>
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <NewsCard key={item.id} news={item} index={index} />
              ))}
            </div>
            
            {loadingMore && (
              <div className="flex flex-col items-center justify-center mt-12 mb-8 text-blue-600">
                <RefreshCw size={24} className="animate-spin mb-2" />
                <p className="text-sm font-medium">Carregando notícias mais antigas...</p>
              </div>
            )}
            
            {!loadingMore && (
              <div className="flex flex-col items-center justify-center mt-12 mb-8 text-blue-400">
                <p className="text-sm font-medium mb-2">Role para ver mais</p>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronDown size={24} />
                </motion.div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-blue-300">
            <Newspaper size={64} strokeWidth={1} className="mb-4" />
            <p className="text-xl font-medium">Nenhuma notícia encontrada</p>
            <button 
              onClick={() => loadNews()}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </main>
      
    </div>
  );
}
