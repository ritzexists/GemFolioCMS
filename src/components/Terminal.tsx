import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme, themes } from '@/context/ThemeContext';
import { logger } from '@/lib/logger';
import DraggableCard from './DraggableCard';
import SnakeGame from './SnakeGame';

interface TerminalProps {
  onOpenCalculator?: () => void;
}

/**
 * Terminal Component
 * 
 * A simulated command-line interface that serves as a secondary navigation
 * and interaction layer for the website. It supports various commands
 * like 'help', 'cd', 'ls', 'search', and 'tags'.
 * 
 * Features:
 * - Animated text output
 * - Command history
 * - Random startup ASCII art (cowsay style)
 * - Theme toggling via 'aesthetic' command
 * - Blog post searching and filtering
 */
export default function Terminal({ onOpenCalculator }: TerminalProps) {
  const [lines, setLines] = useState<(string | React.ReactNode)[]>([]);
  const [input, setInput] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeApp, setActiveApp] = useState<'snake' | 'win96' | 'win98' | 'doom' | 'emshell' | null>(null);
  
  // Refs for accessing latest state in closures (event handlers/timeouts)
  const postsRef = useRef<any[]>([]);
  const tagsRef = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const doomRef = useRef<HTMLIFrameElement>(null);
  
  const navigate = useNavigate();
  const { cycleTheme, setTheme, theme } = useTheme();

  /**
   * Auto-scroll to the bottom of the terminal when new lines are added.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [lines]);

  /**
   * Processes a command string entered by the user.
   * Parses the command and arguments, executes the corresponding logic,
   * and updates the terminal output.
   * 
   * @param cmdLine - The full command string entered by the user.
   */
  const processCommand = (cmdLine: string) => {
    const parts = cmdLine.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argStr = args.join(' ').toLowerCase();

    logger.debug(`Processing terminal command: ${cmd}`, { args });

    const newLines: (string | React.ReactNode)[] = [];

    switch (cmd) {
      case 'help':
        newLines.push(
          "COMMANDS:",
          "  help        - Show this message",
          "  clear       - Clear terminal",
          "  ls          - List pages",
          "  cd [page]   - Navigate to page",
          "  search [q]  - Search blog posts",
          "  tags        - List all tags",
          "  tag [name]  - Filter by tag",
          "  aesthetic   - Cycle visual themes",
          "    list      - List available themes",
          "    [name]    - Set specific theme",
          "  windows96   - Windows 96",
          "  windows98   - Windows 98",
          "  emshell     - BusyBox Shell",
          "  doom        - Play DOOM",
          "  snake       - Play Snake",
          "  calc        - Open Calculator",
          "  unicorn     - ???",
          "  date        - Show system time",
          "  whoami      - Identity check"
        );
        break;
      
      case 'search':
        if (!argStr) {
          newLines.push("Usage: search [query]");
        } else {
          const results = postsRef.current.filter(p => 
            p.frontmatter.title.toLowerCase().includes(argStr) ||
            p.frontmatter.description?.toLowerCase().includes(argStr)
          );
          
          if (results.length > 0) {
            newLines.push(`FOUND ${results.length} MATCHES:`);
            results.slice(0, 5).forEach(p => {
              newLines.push(`  [${p.frontmatter.date}] ${p.frontmatter.title} -> /blog/${p.slug}`);
            });
            if (results.length > 5) newLines.push(`  ...and ${results.length - 5} more.`);
            newLines.push("Type 'cd blog' to see all.");
          } else {
            newLines.push("No matches found.");
          }
        }
        break;

      case 'tags':
        newLines.push(
          <div className="flex gap-2 flex-wrap" key={`tags-${Date.now()}`}>
            {tagsRef.current.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="text-neon-pink hover:bg-neon-pink hover:text-void px-1 border border-neon-pink transition-colors text-xs"
              >
                #{tag}
              </button>
            ))}
          </div>
        );
        break;

      case 'tag':
        if (!argStr) {
          newLines.push("Usage: tag [name]");
        } else {
          const results = postsRef.current.filter(p => 
            p.frontmatter.tags?.some((t: string) => t.toLowerCase() === argStr)
          );
          
          if (results.length > 0) {
            newLines.push(`POSTS TAGGED #${argStr.toUpperCase()}:`);
            newLines.push(
              <div className="flex flex-col gap-1 mt-1" key={`tag-results-${Date.now()}`}>
                {results.map(p => (
                  <button
                    key={p.slug}
                    onClick={() => {
                      setLines(prev => [...prev, `> cd blog/${p.slug}`, `OPENING POST: ${p.frontmatter.title}...`]);
                      setTimeout(() => navigate(`/blog/${p.slug}`), 500);
                    }}
                    className="text-left text-neon-green hover:text-neon-pink hover:underline decoration-dashed underline-offset-4 transition-colors"
                  >
                    [{p.frontmatter.date}] {p.frontmatter.title}
                  </button>
                ))}
              </div>
            );
          } else {
            newLines.push(`No posts found with tag #${argStr}.`);
          }
        }
        break;
      
      case 'clear':
        setLines([]);
        return;

      case 'date':
        newLines.push(new Date().toString());
        break;

      case 'aesthetic':
        if (args.length === 0) {
          const newTheme = cycleTheme();
          newLines.push(`THEME UPDATED: ${newTheme.toUpperCase()}`);
        } else if (args[0] === 'list') {
          newLines.push("AVAILABLE THEMES:");
          Object.keys(themes).forEach(t => {
            newLines.push(`  ${t}${t === theme ? ' *' : ''}`);
          });
        } else {
          const requestedTheme = args[0].toLowerCase();
          if (Object.keys(themes).includes(requestedTheme)) {
            setTheme(requestedTheme as any);
            newLines.push(`THEME SET TO: ${requestedTheme.toUpperCase()}`);
          } else {
            newLines.push(`Theme '${requestedTheme}' not found. Type 'aesthetic list' to see options.`);
          }
        }
        break;

      case 'windows96':
      case 'win96':
        setActiveApp('win96');
        newLines.push("CONNECTING TO WINDOWS 96...");
        break;

      case 'windows98':
      case 'win98':
        setActiveApp('win98');
        newLines.push("TIME TRAVELING TO 1998...");
        break;

      case 'doom':
        setActiveApp('doom');
        newLines.push("INITIALIZING UAC TELEPORTER...");
        break;

      case 'emshell':
      case 'busybox':
        setActiveApp('emshell');
        newLines.push("BOOTING BUSYBOX KERNEL...");
        break;

      case 'snake':
        setActiveApp('snake');
        newLines.push("LAUNCHING SNAKE.EXE...");
        break;

      case 'calc':
      case 'calculator':
        if (onOpenCalculator) {
          onOpenCalculator();
          newLines.push("LAUNCHING CALC.EXE...");
        } else {
          newLines.push("ERROR: CALCULATOR MODULE NOT FOUND.");
        }
        break;

      case 'unicorn':
        newLines.push("UNICORN POWER ACTIVATED!");
        const script = document.createElement('script');
        script.src = 'https://www.cornify.com/js/cornify.js';
        script.async = true;
        script.onload = () => {
          // @ts-ignore
          if (window.cornify_add) window.cornify_add();
        };
        document.body.appendChild(script);
        // Also try to call it immediately if already loaded
        // @ts-ignore
        if (window.cornify_add) window.cornify_add();
        break;

      case 'whoami':
        newLines.push("You are the observer.");
        break;

      case 'ls':
        newLines.push(
          "PAGES:",
          "  /home",
          "  /blog",
          "  /profile",
          "  /admin",
          "  /p/portfolio",
          "  /p/hubs"
        );
        break;

      case 'cd':
      case 'goto':
      case 'nav':
        if (args.length === 0) {
          newLines.push("Usage: cd [page]");
        } else {
          const dest = args[0].toLowerCase().replace(/^\//, '');
          const routes: Record<string, string> = {
            'home': '/',
            'blog': '/blog',
            'profile': '/profile',
            'admin': '/admin',
            'works': '/p/portfolio',
            'portfolio': '/p/portfolio',
            'hubs': '/p/hubs'
          };

          // Check if it matches a blog slug
          const post = postsRef.current.find(p => p.slug === dest || `blog/${p.slug}` === dest);
          if (post) {
             newLines.push(`OPENING POST: ${post.frontmatter.title}...`);
             setTimeout(() => navigate(`/blog/${post.slug}`), 500);
             break;
          }

          if (routes[dest] || dest === '') {
            const path = routes[dest] || (dest === '' ? '/' : dest);
            newLines.push(`NAVIGATING TO ${path.toUpperCase()}...`);
            setTimeout(() => navigate(path), 500);
          } else {
            newLines.push(`ERROR: Destination '${dest}' not found.`);
          }
        }
        break;

      default:
        newLines.push(`Command not found: ${cmd}`);
    }

    setLines(prev => [...prev, ...newLines]);
  };

  /**
   * Handles clicking on a tag button.
   * Simulates typing 'tag [name]' into the terminal.
   */
  const handleTagClick = (tag: string) => {
    const cmd = `tag ${tag}`;
    setLines(prev => [...prev, `> ${cmd}`]);
    processCommand(cmd);
  };

  /**
   * Handles the form submission (pressing Enter).
   */
  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmdLine = input.trim();
    setLines(prev => [...prev, `> ${cmdLine}`]);
    processCommand(cmdLine);
    setInput("");
  };

  const sprites = [
    {
      art: `
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`
    },
    {
      art: `
        \\   (oo)
         \\  (__)
            ^  ^`
    },
    {
      art: `
        \\   /
         \\  o
            O`
    },
    {
      art: `
        \\   .--.
         \\ |o_o |
           |:_/ |
          //   \\ \\
         (|     | )
        /'\\_   _/\`\\
        \\___)=(___/`
    }
  ];

  const fortunes = [
    "To err is human... to really foul up requires the root password.",
    "Unix is user friendly. It's just very picky about who its friends are.",
    "The best way to predict the future is to invent it.",
    "Avoid the gates of hell. Use Linux.",
    "Don't patch bad code - rewrite it.",
    "rm -rf / is not a backup strategy.",
    "Software is like sex: it's better when it's free.",
    "There are two major products that come out of Berkeley: LSD and UNIX.",
    "Talk is cheap. Show me the code.",
    "Computers are like air conditioners: they stop working when you open windows."
  ];

  const jargonEntries = [
    { term: "Yak Shaving", preview: "Seemingly pointless activity necessary to solve a problem which solves a problem...", url: "http://catb.org/jargon/html/Y/yak-shaving.html" },
    { term: "Heisenbug", preview: "A bug that disappears or alters its behavior when one attempts to probe it.", url: "http://catb.org/jargon/html/H/heisenbug.html" },
    { term: "Grok", preview: "To understand. Connoting intimate and exhaustive knowledge.", url: "http://catb.org/jargon/html/G/grok.html" },
    { term: "Rubber Ducking", preview: "Explaining code line-by-line to a rubber duck to find a bug.", url: "http://catb.org/jargon/html/R/rubber-ducking.html" },
    { term: "Daemon", preview: "A program that runs in the background, rather than under direct user control.", url: "http://catb.org/jargon/html/D/daemon.html" },
    { term: "Bikeshedding", preview: "Discussions about minor issues while ignoring more complex ones.", url: "http://catb.org/jargon/html/B/bikeshedding.html" },
    { term: "Foo", preview: "The first metasyntactic variable.", url: "http://catb.org/jargon/html/F/foo.html" },
    { term: "Kludge", preview: "A clumsy or inelegant solution to a problem.", url: "http://catb.org/jargon/html/K/kludge.html" }
  ];

  /**
   * Initialize terminal data on mount.
   * Fetches posts, extracts tags, and sets up the initial ASCII art.
   */
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        postsRef.current = data;
        
        // Extract tags
        const tagCounts: Record<string, number> = {};
        data.forEach((post: any) => {
          post.frontmatter.tags?.forEach((tag: string) => {
            const t = tag.toLowerCase();
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        });
        
        const sortedTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([tag]) => tag);
          
        setTags(sortedTags);
        tagsRef.current = sortedTags;

        // Initialize terminal
        const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
        const randomSprite = sprites[Math.floor(Math.random() * sprites.length)];
        const randomJargon = jargonEntries[Math.floor(Math.random() * jargonEntries.length)];
        
        const topTags = sortedTags.slice(0, 5);
        const maxLen = Math.max(randomFortune.length, 30);
        const border = '_'.repeat(maxLen + 2);
        const bottomBorder = '-'.repeat(maxLen + 2);

        const cowsayBlock = (
          <div className="flex flex-col items-start" key="cowsay-init">
            <div> {border}</div>
            <div>&lt; {randomFortune.padEnd(maxLen)} &gt;</div>
            
            {topTags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 my-1 max-w-full">
                {topTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className="text-neon-pink hover:bg-neon-pink hover:text-void px-1 border border-neon-pink transition-colors text-xs"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            <div className="px-2 my-1 text-xs text-gray-400 italic border-l-2 border-gray-600 pl-2 ml-2">
              <span className="text-neon-green font-bold">JARGON FILE: </span>
              <a 
                href={randomJargon.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white hover:underline"
              >
                {randomJargon.term}
              </a>
              <div className="text-[10px] opacity-80">"{randomJargon.preview}"</div>
            </div>
            
            <div> {bottomBorder}</div>
            <div className="whitespace-pre">{randomSprite.art}</div>
          </div>
        );

        setLines([
          "ACCESS GRANTED.",
          cowsayBlock,
          "",
          "Type 'help' for commands."
        ]);
        logger.info("Terminal initialized");
      })
      .catch(err => {
        logger.error("Failed to fetch posts for terminal", err);
      });
  }, []);

  return (
    <DraggableCard 
      className="neobrutal-box w-full flex flex-col p-4 font-mono text-sm md:text-base relative overflow-hidden transition-colors duration-300 cursor-grab active:cursor-grabbing"
      initialHeight={400}
    >
      <div className="absolute top-0 left-0 right-0 h-6 bg-neon-pink flex items-center px-2 justify-between transition-colors duration-300 z-10 pointer-events-none">
        <span className="text-void font-bold text-xs">
          {activeApp === 'snake' ? 'SNAKE // PYTHON' :
           activeApp === 'win96' ? 'WINDOWS 96 // MIKESOFT' :
           activeApp === 'win98' ? 'WINDOWS 98 // REDMOND' :
           activeApp === 'emshell' ? 'EM-SHELL // BUSYBOX' :
           activeApp === 'doom' ? 'DOOM // ID SOFTWARE' :
           `TERMINAL_V1.1 // ${theme.toUpperCase()}`}
        </span>
        <div className="flex gap-1 items-center">
          {activeApp && (
            <button 
              onClick={() => setActiveApp(null)}
              className="mr-2 px-1 bg-void text-neon-pink text-[10px] font-bold hover:bg-white hover:text-void pointer-events-auto transition-colors"
            >
              EXIT
            </button>
          )}
          {themes[theme].palette ? (
            themes[theme].palette.map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-full border border-void/20" style={{ backgroundColor: color }}></div>
            ))
          ) : (
            <>
              <div className="w-3 h-3 bg-void rounded-full"></div>
              <div className="w-3 h-3 bg-void rounded-full"></div>
            </>
          )}
        </div>
      </div>
      
      {activeApp ? (
        <div 
          className={`mt-6 w-full h-full flex-1 overflow-hidden relative ${activeApp !== 'snake' ? 'bg-black' : ''}`} 
          onPointerDown={(e) => {
            e.stopPropagation();
            if (activeApp === 'doom' && doomRef.current) {
              doomRef.current.requestPointerLock();
            }
          }}
        >
          {activeApp === 'snake' ? (
            <SnakeGame onExit={() => setActiveApp(null)} />
          ) : activeApp === 'win96' ? (
            <iframe 
              src="https://windows96.net/"
              className="w-full h-full border-none" 
              title="Windows 96"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
            />
          ) : activeApp === 'win98' ? (
            <iframe 
              src="https://98.js.org/"
              className="w-full h-full border-none" 
              title="Windows 98"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
            />
          ) : activeApp === 'emshell' ? (
            <iframe 
              src="https://ustymukhman.github.io/em-shell/"
              className="w-full h-full border-none" 
              title="em-shell"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
            />
          ) : activeApp === 'doom' ? (
            <iframe 
              ref={doomRef}
              src="https://ustymukhman.github.io/webDOOM/public/"
              className="w-full h-full border-none" 
              title="DOOM"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media"
            />
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-6 flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 select-text cursor-text" onPointerDown={(e) => e.stopPropagation()}>
            {lines.map((line, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-neon-green break-words whitespace-pre-wrap"
              >
                {line}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleCommand} className="mt-4 flex gap-2 border-t border-white/20 pt-2 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
            <span className="text-neon-pink">{'>'}</span>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-white font-mono min-w-0"
              autoFocus
              placeholder="Enter command..."
            />
          </form>
        </>
      )}
    </DraggableCard>
  );
}
