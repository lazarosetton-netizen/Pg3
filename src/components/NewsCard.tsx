import { memo } from "react";
import { motion } from "motion/react";
import { Calendar, Clock, ExternalLink, ChevronRight } from "lucide-react";
import { NewsItem } from "../types";
import { useNavigate } from "react-router-dom";

interface NewsCardProps {
  news: NewsItem;
  index: number;
}

export const NewsCard = memo(({ news, index }: NewsCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/news/${news.id}`, { state: { news } });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="bg-white border-l-4 border-l-blue-600 border-y border-r border-blue-100 rounded-r-xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
          {news.source}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {news.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {news.time}
          </span>
        </div>
      </div>
      
      <h3 className="text-2xl font-black text-blue-900 mb-3 leading-tight group-hover:text-blue-700 transition-colors">
        {news.title}
      </h3>
      
      <p className="text-gray-600 text-base leading-relaxed mb-6 line-clamp-4 flex-grow">
        {news.summary}
      </p>
      
      <div className="flex items-center justify-between pt-4 border-t border-blue-50">
        <span className="text-blue-600 font-black text-xs uppercase tracking-widest flex items-center gap-1">
          Ler Notícia Completa <ChevronRight size={14} />
        </span>
        <a 
          href={news.originalUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full"
          title="Ver original"
        >
          <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  );
});
