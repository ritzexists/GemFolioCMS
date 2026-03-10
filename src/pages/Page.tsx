import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import DraggableCard from '@/components/DraggableCard';

interface PageData {
  slug: string;
  frontmatter: {
    title: string;
    description?: string;
    layout?: 'standard' | 'portfolio' | 'cards' | 'recs';
    items?: any[];
  };
  content: string;
}

export default function Page() {
  const { slug } = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pages/${slug}`)
      .then(res => res.json())
      .then(data => {
        setPage(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="text-neon-pink animate-pulse text-center mt-20">LOADING SECTOR...</div>;
  if (!page) return <div className="text-red-500 text-center mt-20">404: SECTOR NOT FOUND</div>;

  const renderLayout = () => {
    switch (page.frontmatter.layout) {
      case 'portfolio':
      case 'recs':
        const isRecs = page.frontmatter.layout === 'recs';
        return (
          <div className={`grid grid-cols-1 ${isRecs ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 mt-8`}>
            {page.frontmatter.items?.map((item: any, i: number) => (
              <a
                href={item.link}
                key={i}
                className="block group h-full"
                draggable={false}
              >
                <DraggableCard 
                  className="neobrutal-box p-0 overflow-hidden relative flex flex-col lg:flex-row h-full cursor-grab active:cursor-grabbing"
                  hoverEffect="invert"
                >
                  {/* Image Section - 2 parts (40%) */}
                  <div className="w-full lg:w-2/5 h-48 lg:h-auto border-b-2 lg:border-b-0 lg:border-r-2 border-neon-pink relative overflow-hidden shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:grayscale"
                      draggable={false}
                    />
                  </div>
                  {/* Text Section - 3 parts (60%) */}
                  <div className="w-full lg:w-3/5 p-6 bg-void relative flex flex-col flex-grow justify-center">
                    <h3 className="text-xl font-black text-neon-green mb-3 group-hover:text-neon-pink transition-colors card-action inline-block">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/70 font-mono leading-relaxed flex-grow">
                      {item.description}
                    </p>
                    <ExternalLink className="absolute top-6 right-6 text-white/20 group-hover:text-neon-pink transition-colors card-action" size={20} />
                  </div>
                </DraggableCard>
              </a>
            ))}
          </div>
        );
      
      case 'cards':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {page.frontmatter.items?.map((item: any, i: number) => (
              <a
                href={item.link}
                key={i}
                className="block group h-full"
                draggable={false}
              >
                <DraggableCard 
                  className="neobrutal-box p-4 flex flex-col items-center text-center hover:bg-white/5 transition-colors h-full cursor-grab active:cursor-grabbing"
                  hoverEffect="skew"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-neon-pink mb-4 group-hover:rotate-12 transition-transform card-action">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" draggable={false} />
                  </div>
                  <h3 className="font-bold text-lg text-white mb-1 card-action">{item.title}</h3>
                  <span className={`text-xs font-mono px-2 py-0.5 border ${
                    item.status === 'Online' ? 'border-neon-green text-neon-green' : 'border-red-500 text-red-500'
                  }`}>
                    {item.status}
                  </span>
                </DraggableCard>
              </a>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="neobrutal-box p-8 bg-void mb-8">
        <h1 className="text-4xl md:text-6xl font-black text-neon-pink mb-6 border-b-4 border-neon-green pb-4 inline-block">
          {page.frontmatter.title}
        </h1>
        
        <div className="markdown-body prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-neon-green prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-neon-pink prose-strong:font-black max-w-none">
          <MarkdownRenderer content={page.content} />
        </div>
      </div>

      {renderLayout()}
    </div>
  );
}
