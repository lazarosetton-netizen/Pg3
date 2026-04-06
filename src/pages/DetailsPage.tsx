import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Calendar, Clock, ExternalLink, ShieldCheck, Globe, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { fetchNews } from "../services/newsService";
import { NewsItem } from "../types";

export function DetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews();
      const item = data.find(n => n.id === id);
      if (item) {
        setNews(item);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Failed to fetch news details:", err);
      setError(err.message || "Ocorreu um erro ao carregar os detalhes da notícia.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-600 font-medium">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-red-50 p-8 rounded-3xl border border-red-100">
          <Info size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-black text-red-900 mb-2">Erro de Carregamento</h2>
          <p className="text-sm text-red-600 mb-8 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => loadNews()}
              className="bg-red-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              Tentar Novamente
            </button>
            <Link 
              to="/" 
              className="text-blue-600 font-black uppercase tracking-widest text-xs hover:underline"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100 px-6 py-4 flex items-center shadow-sm">
        <Link to="/" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-4">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-black text-blue-900 tracking-tighter">PGNEWS</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header Section */}
          <div className="mb-12 border-b border-blue-100 pb-12">
            <div className="flex items-center gap-4 text-sm text-blue-500 mb-6 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Calendar size={16} />
                {news.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {news.time}
              </span>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-black">
                {news.source}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-blue-900 leading-tight mb-8 tracking-tighter">
              {news.title}
            </h2>
            
            <p className="text-xl text-blue-600 font-medium leading-relaxed italic border-l-4 border-blue-600 pl-6">
              {news.summary}
            </p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed text-xl">
                <ReactMarkdown
                  components={{
                    img: () => null, // Explicitly remove any images from markdown
                  }}
                >
                  {news.fullText}
                </ReactMarkdown>
              </div>
              
              <div className="mt-16 pt-8 border-t border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs">
                  <Globe size={18} />
                  <span>Fonte Original</span>
                </div>
                <a 
                  href={news.originalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200"
                >
                  Visitar site <ExternalLink size={16} />
                </a>
              </div>

              <div className="mt-12">
                <Link 
                  to="/" 
                  className="inline-flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-xs hover:underline"
                >
                  <ChevronLeft size={20} /> Voltar para a página principal
                </Link>
              </div>
            </div>

            {/* Sidebar / Commentary */}
            <aside className="lg:col-span-1">
              <div className="sticky top-28 space-y-8">
                <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 text-blue-800 opacity-20">
                    <ShieldCheck size={140} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6 text-blue-300">
                      <ShieldCheck size={24} />
                      <h3 className="font-black uppercase tracking-widest text-[10px]">Análise Geopolítica</h3>
                    </div>
                    <p className="text-base leading-relaxed italic text-blue-50 font-medium">
                      "{news.commentary}"
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-4 text-blue-600">
                    <Info size={20} />
                    <h3 className="font-black uppercase tracking-widest text-[10px]">Compromisso PGNEWS</h3>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    Este conteúdo foi rigorosamente analisado e traduzido para garantir a precisão dos fatos sobre a soberania de Israel. 
                    Nossa missão é combater a desinformação com dados históricos e análises estratégicas.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </main>

    </div>
  );
}
