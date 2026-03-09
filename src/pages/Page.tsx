import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeMathjax]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-4xl md:text-5xl font-black text-neon-green mb-6 border-b-4 border-neon-pink pb-2 inline-block" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-3xl md:text-4xl font-black text-neon-green mt-12 mb-6 flex items-center gap-2 before:content-['#'] before:text-neon-pink" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4 border-l-4 border-neon-green pl-4" {...props} />,
              a: ({node, ...props}) => (
                <a 
                  className="text-neon-pink font-bold border-b-2 border-neon-pink hover:bg-neon-pink hover:text-void transition-all no-underline px-1 -mx-1" 
                  {...props} 
                />
              ),
              ul: ({node, ...props}) => <ul className="space-y-2 my-6 list-none pl-0" {...props} />,
              ol: ({node, ...props}) => <ol className="space-y-2 my-6 list-decimal list-inside marker:text-neon-pink marker:font-bold" {...props} />,
              li: ({node, ...props}) => (
                <li className="flex gap-3 items-start" {...props}>
                  <span className="text-neon-pink font-bold mt-1.5 text-xs">►</span>
                  <span>{props.children}</span>
                </li>
              ),
              hr: ({node, ...props}) => <hr className="border-t-4 border-dashed border-white/20 my-12" {...props} />,
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="neobrutal-box border-neon-green shadow-[4px_4px_0px_0px_var(--color-neon-green)] my-8 overflow-hidden">
                    <div className="bg-neon-green text-void px-4 py-1 text-xs font-bold uppercase flex justify-between items-center border-b-2 border-neon-green">
                      <span>{match[1]}</span>
                      <span>TERMINAL_EXEC</span>
                    </div>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, borderRadius: 0, background: '#09090b', padding: '1.5rem' }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className="bg-white/10 text-neon-pink px-1.5 py-0.5 rounded text-sm font-mono border border-white/20" {...props}>
                    {children}
                  </code>
                );
              },
              img: ({node, ...props}) => (
                <figure className="my-10">
                  <div className="neobrutal-box p-2 bg-white/5">
                    <img {...props} className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-500" />
                  </div>
                  {props.title && <figcaption className="text-center text-xs font-mono text-neon-pink mt-2 uppercase tracking-widest">// {props.title}</figcaption>}
                </figure>
              ),
              blockquote: ({node, ...props}) => (
                <blockquote className="relative border-l-8 border-neon-pink bg-white/5 p-6 my-10 italic text-xl text-white/90" {...props}>
                  <span className="absolute -top-4 left-4 text-6xl text-neon-pink/20 font-serif leading-none">"</span>
                  <div className="relative z-10">
                    {props.children}
                  </div>
                </blockquote>
              )
            }}
          >
            {page.content}
          </ReactMarkdown>
        </div>
      </div>

      {renderLayout()}
    </div>
  );
}
