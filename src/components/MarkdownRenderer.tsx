import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

/**
 * MarkdownRenderer component
 * 
 * Renders markdown content with support for:
 * - MathJax/LaTeX (via remark-math and rehype-katex)
 * - Syntax highlighting (via react-syntax-highlighter)
 * - Custom neobrutalist styling
 * 
 * @param {string} content - The markdown content to render.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
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
          <span className="my-10 block">
            <span className="neobrutal-box p-2 bg-white/5 block">
              <img {...props} className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-500" />
            </span>
            {props.title && <span className="text-center text-xs font-mono text-neon-pink mt-2 uppercase tracking-widest block">// {props.title}</span>}
          </span>
        ),
        blockquote: ({node, ...props}) => (
          <span className="relative border-l-8 border-neon-pink bg-white/5 p-6 my-10 italic text-xl text-white/90 block" {...props}>
            <span className="absolute -top-4 left-4 text-6xl text-neon-pink/20 font-serif leading-none">"</span>
            <span className="relative z-10 block">
              {props.children}
            </span>
          </span>
        )
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
