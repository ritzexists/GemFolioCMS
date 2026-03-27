import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { ArrowLeft } from 'lucide-react';

interface PostData {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    tags?: string[];
    description?: string;
  };
  content: string;
}

export default function Post() {
  const params = useParams();
  const slug = params['*'];
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/posts/${slug}.json`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <div className="text-neon-pink animate-pulse text-center mt-20">DECRYPTING...</div>;
  if (!post) return <div className="text-red-500 text-center mt-20">404: DATA NOT FOUND</div>;

  const postBasePath = slug ? `${import.meta.env.BASE_URL}content/posts/${slug}/` : `${import.meta.env.BASE_URL}content/posts/`;

  return (
    <article className="max-w-3xl mx-auto">
      <Link to="/blog" className="inline-flex items-center text-neon-green hover:underline mb-8 uppercase font-bold text-sm">
        <ArrowLeft size={16} className="mr-2" /> Back to Archives
      </Link>

      <header className="mb-12 border-b-2 border-white/20 pb-8">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
          {post.frontmatter.title}
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-neon-pink">
          <span>{post.frontmatter.date}</span>
          <span>//</span>
          <div className="flex gap-2">
            {post.frontmatter.tags?.map(tag => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="markdown-body prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-neon-green prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-neon-pink prose-strong:font-black max-w-none">
        <MarkdownRenderer content={post.content} basePath={postBasePath} />
      </div>
    </article>
  );
}
