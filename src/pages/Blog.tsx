import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { X, Search, Rss } from 'lucide-react';

interface Post {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags?: string[];
    description?: string;
  };
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tagFilter = searchParams.get('tag');
  const searchQuery = searchParams.get('search');
  const [localSearch, setLocalSearch] = useState(searchQuery || "");

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        
        // Extract and sort tags
        const tagCounts: Record<string, number> = {};
        data.forEach((post: Post) => {
          post.frontmatter.tags?.forEach(tag => {
            const normalizedTag = tag.toUpperCase();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          });
        });
        
        const sortedTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([tag]) => tag)
          .slice(0, 20); // Show more tags on archive
          
        setTags(sortedTags.length > 0 ? sortedTags : ['DESIGN', 'CODE', 'CHAOS', 'REACT', 'VOID']);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setLocalSearch(searchQuery || "");
  }, [searchQuery]);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams(searchParams);
      if (localSearch) {
        params.set('search', localSearch);
        params.delete('tag'); // Optional: clear tag when searching
      } else {
        params.delete('search');
      }
      setSearchParams(params);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (tagFilter) {
      return post.frontmatter.tags?.some(tag => tag.toUpperCase() === tagFilter.toUpperCase());
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return post.frontmatter.title.toLowerCase().includes(q) || 
             post.frontmatter.description?.toLowerCase().includes(q) ||
             post.frontmatter.tags?.some(tag => tag.toLowerCase().includes(q));
    }
    return true;
  });

  const clearFilters = () => {
    setSearchParams({});
    setLocalSearch("");
  };

  if (loading) {
    return <div className="text-neon-pink animate-pulse text-center mt-20">LOADING ARCHIVES...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b-4 border-neon-pink pb-8">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-4xl md:text-6xl text-neon-green">
            ARCHIVES
          </h1>
          <a 
            href="/rss.xml" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-void transition-all font-bold uppercase text-sm"
          >
            <Rss size={18} />
            <span className="hidden sm:inline">Subscribe via RSS</span>
            <span className="sm:hidden">RSS</span>
          </a>
        </div>

        {/* Search and Tags Section */}
        <div className="space-y-6">
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-pink" size={20} />
            <input 
              type="text" 
              placeholder="SEARCH THE ARCHIVES..." 
              className="neobrutal-input pl-14 text-right pr-4 w-full"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSearchParams({ tag })}
                className={`px-3 py-1 border text-sm font-bold uppercase cursor-pointer transition-colors ${
                  tagFilter === tag 
                    ? 'bg-neon-pink text-void border-neon-pink' 
                    : 'border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-void'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(tagFilter || searchQuery) && (
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded border border-white/10">
          <span className="text-white/70">
            FILTERING BY {tagFilter ? `TAG: ${tagFilter}` : `SEARCH: ${searchQuery}`}
          </span>
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 text-neon-pink hover:text-white uppercase font-bold text-sm ml-auto"
          >
            <X size={16} /> CLEAR
          </button>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/20">
          <h3 className="text-2xl font-bold text-white/50">NO TRANSMISSIONS FOUND</h3>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link to={`/blog/${post.slug}`} className="block group">
                <motion.div 
                  whileHover={{ y: -5, x: -5 }}
                  className="neobrutal-box p-6 md:p-8 hover:shadow-[8px_8px_0px_0px_var(--color-neon-green)] hover:border-neon-green transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl md:text-3xl font-black group-hover:text-neon-green transition-colors">
                      {post.frontmatter.title}
                    </h2>
                    <span className="font-mono text-sm border border-white/30 px-2 py-1 text-white/70">
                      {post.frontmatter.date}
                    </span>
                  </div>
                  
                  <p className="text-lg opacity-80 mb-6 text-white/80">
                    {post.frontmatter.description}
                  </p>

                  <div className="flex gap-2">
                    {post.frontmatter.tags?.map(tag => (
                      <span key={tag} className="text-xs uppercase font-bold tracking-wider opacity-60 border border-white/20 px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
