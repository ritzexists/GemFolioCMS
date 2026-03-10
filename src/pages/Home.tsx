import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Terminal from '@/components/Terminal';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '@/context/SiteConfigContext';
import DraggableCard from '@/components/DraggableCard';
import Calculator from '@/components/Calculator';
import SEO from '@/components/SEO';

interface Post {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags?: string[];
    description?: string;
  };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const { config } = useSiteConfig();

  useEffect(() => {
    fetch('/api/posts.json')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
      });
  }, []);

  return (
    <div className="space-y-12">
      <SEO title="Home" description={config.heroDescription} />
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Intro & Search */}
        <div className="space-y-8">
          <DraggableCard 
            className="neobrutal-box p-8 bg-neon-green/10 cursor-grab active:cursor-grabbing"
            hoverEffect="rotate"
          >
            <h1 className="text-4xl md:text-6xl font-black text-neon-pink mb-4 leading-none whitespace-pre-line">
              {config.heroTitle}
            </h1>
            <p className="text-lg mb-6 border-l-4 border-white pl-4">
              {config.heroDescription}
            </p>
          </DraggableCard>
        </div>

        {/* Right Column: Terminal */}
        <div className="h-full">
          <Terminal onOpenCalculator={() => setIsCalculatorOpen(true)} />
        </div>
      </section>

      {isCalculatorOpen && (
        <Calculator onClose={() => setIsCalculatorOpen(false)} />
      )}

      {/* Recent Posts */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b-2 border-white/20 pb-2">
          <h2 className="text-2xl text-neon-green">Latest Transmissions</h2>
          <Link to="/blog" className="text-sm underline decoration-neon-pink underline-offset-4 hover:text-neon-pink">View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.slice(0, 3).map((post) => (
            <div 
              key={post.slug} 
              className="h-full"
            >
              <DraggableCard 
                className="neobrutal-box h-full p-6 flex flex-col justify-between hover:shadow-[8px_8px_0px_0px_var(--color-neon-green)] hover:border-neon-green transition-all cursor-grab active:cursor-grabbing"
                hoverEffect="rotate"
              >
                <div>
                  <div className="text-xs text-white/50 mb-2 font-mono">{post.frontmatter.date}</div>
                  <Link to={`/blog/${post.slug}`} className="group/title inline-block mb-3">
                    <h3 className="text-xl text-white group-hover/title:text-neon-green line-clamp-2 card-action transition-colors">
                      {post.frontmatter.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-white/70 line-clamp-3 mb-4">
                    {post.frontmatter.description}
                  </p>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {post.frontmatter.tags?.map(tag => (
                    <Link 
                      key={tag} 
                      to={`/blog?tag=${tag}`}
                      className="text-xs border border-white/30 px-2 py-0.5 rounded-full hover:bg-neon-pink hover:text-void hover:border-neon-pink transition-colors card-action"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </DraggableCard>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
