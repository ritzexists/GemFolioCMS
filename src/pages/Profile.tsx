import React, { useState, useEffect } from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface PageData {
  slug: string;
  frontmatter: {
    title: string;
    description?: string;
  };
  content: string;
}

export default function Profile() {
  const [page, setPage] = useState<PageData | null>(null);

  useEffect(() => {
    fetch('/api/pages/profile.json')
      .then(res => res.json())
      .then(data => setPage(data))
      .catch(err => console.error(err));
  }, []);

  if (!page) return <div className="text-neon-pink animate-pulse text-center mt-20">LOADING PROFILE...</div>;

  const { profile } = page.frontmatter as any;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1">
        <div className="neobrutal-box p-4 sticky top-24">
          <div className="aspect-square bg-neon-pink mb-4 overflow-hidden relative group">
            <img 
              src={profile?.image || "https://picsum.photos/seed/profile/400/400"} 
              alt="Profile" 
              crossOrigin="anonymous"
              className="w-full h-full object-cover mix-blend-multiply filter grayscale group-hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-neon-green/20 mix-blend-overlay"></div>
          </div>
          <h2 className="text-2xl font-black text-center uppercase mb-2">{profile?.name || "The Creator"}</h2>
          <div className="text-center font-mono text-xs text-white/60">
            STATUS: {profile?.status || "UNKNOWN"}<br/>
            LOCATION: {profile?.location || "UNKNOWN"}
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="neobrutal-box p-8 bg-void min-h-[400px]">
          <h1 className="text-4xl font-black text-neon-green mb-8 border-b-2 border-white/20 pb-4">
            {page.frontmatter.title}
          </h1>
          
          <div className="markdown-body prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-neon-green prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-neon-pink prose-strong:font-black max-w-none">
            <MarkdownRenderer content={page.content} basePath="/content/pages/profile/" />
          </div>
        </div>
      </div>
    </div>
  );
}
