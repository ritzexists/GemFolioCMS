import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTheme, themes } from '@/context/ThemeContext';
import { logger } from '@/lib/logger';
import DraggableCard from './DraggableCard';
import SnakeGame from './SnakeGame';
import { GoogleGenAI } from "@google/genai";

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
  const [activeApp, setActiveApp] = useState<'snake' | 'win96' | 'win98' | 'win93' | 'emshell' | 'doom' | 'linux' | 'linux-gui' | null>(null);
  
  // Refs for accessing latest state in closures (event handlers/timeouts)
  const postsRef = useRef<any[]>([]);
  const tagsRef = useRef<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doomRef = useRef<HTMLIFrameElement>(null);
  const linuxRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (activeApp === 'linux' && linuxRef.current) {
      linuxRef.current.focus();
    }
  }, [activeApp]);
  
  const navigate = useNavigate();
  const { cycleTheme, setTheme, theme } = useTheme();

  /**
   * Auto-scroll to the bottom of the terminal when new lines are added.
   * Ensures the latest output is always visible.
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
  const processCommand = async (cmdLine: string) => {
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
          "  windows93   - Windows 93",
          "  emshell     - Emscripten Shell",
          "  linux       - Linux Shell (WebVM)",
          "  linux-gui   - Linux GUI (Alpine)",
          "  doom        - Play DOOM",
          "  snake       - Play Snake",
          "  calc        - Open Calculator",
          "  ai          - Ask AI assistant",
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

      case 'windows93':
      case 'win93':
        setActiveApp('win93');
        newLines.push("LOADING WINDOWS 93...");
        break;

      case 'emshell':
        setActiveApp('emshell');
        newLines.push("LOADING EMSHELL...");
        break;

      case 'doom':
        setActiveApp('doom');
        newLines.push("INITIALIZING UAC TELEPORTER...");
        break;

      case 'linux':
        setActiveApp('linux');
        newLines.push("BOOTING LINUX (WEBVM)...");
        break;

      case 'linux-gui':
        setActiveApp('linux-gui');
        newLines.push("BOOTING LINUX GUI (ALPINE)...");
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

      case 'ai':
        if (!argStr) {
          newLines.push("Usage: ai [prompt]");
        } else {
          newLines.push("THINKING...");
          setLines(prev => [...prev, ...newLines]);
          
          try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: argStr,
            });
            setLines(prev => [...prev.slice(0, -1), response.text || "No response."]);
          } catch (e) {
            setLines(prev => [...prev.slice(0, -1), "ERROR: AI FAILED."]);
          }
          return;
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
        const pages = [
          "  /home",
          "  /blog",
          "  /profile",
          ...(import.meta.env.VITE_DISABLE_ADMIN === 'false' || (!import.meta.env.PROD && import.meta.env.VITE_DISABLE_ADMIN !== 'true') ? ["  /admin"] : []),
          "  /p/portfolio",
          "  /p/hubs"
        ];
        newLines.push("PAGES:", ...pages);
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
            ...(import.meta.env.VITE_DISABLE_ADMIN === 'false' || (!import.meta.env.PROD && import.meta.env.VITE_DISABLE_ADMIN !== 'true') ? { 'admin': '/admin' } : {}),
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
   * Simulates typing 'tag [name]' into the terminal and executes it.
   * 
   * @param tag - The tag name that was clicked.
   */
  const handleTagClick = async (tag: string) => {
    const cmd = `tag ${tag}`;
    setLines(prev => [...prev, `> ${cmd}`]);
    await processCommand(cmd);
  };

  /**
   * Handles the form submission (pressing Enter).
   * Prevents default form behavior, adds the command to the output,
   * and triggers command processing.
   * 
   * @param e - The form submission event.
   */
  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmdLine = input.trim();
    setLines(prev => [...prev, `> ${cmdLine}`]);
    await processCommand(cmdLine);
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
    "A journey of a thousand miles begins with a single step.",
    "The only way to do great work is to love what you do.",
    "Believe you can and you're halfway there.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Your time is limited, so don't waste it living someone else's life.",
    "The future belongs to those who believe in the beauty of their dreams.",
    "In the middle of every difficulty lies opportunity.",
    "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    "Everything you've ever wanted is on the other side of fear.",
    "Hardships often prepare ordinary people for an extraordinary destiny.",
    "The only limit to our realization of tomorrow will be our doubts of today.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Everything has beauty, but not everyone sees it.",
    "Life is what happens when you're busy making other plans.",
    "Get busy living or get busy dying.",
    "You only live once, but if you do it right, once is enough.",
    "Many of life's failures are people who did not realize how close they were to success when they gave up.",
    "If you want to live a happy life, tie it to a goal, not to people or things.",
    "Never let the fear of striking out keep you from playing the game.",
    "Money and success don't change people; they merely amplify what is already there.",
    "The best way to predict the future is to invent it.",
    "Don't patch bad code - rewrite it.",
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
    { term: "Kludge", preview: "A clumsy or inelegant solution to a problem.", url: "http://catb.org/jargon/html/K/kludge.html" },
    { term: "Cruft", preview: "Unnecessary code or hardware that is still present in a system.", url: "http://catb.org/jargon/html/C/cruft.html" },
    { term: "Frob", preview: "To manipulate something in a small, often aimless way.", url: "http://catb.org/jargon/html/F/frob.html" },
    { term: "Glitch", preview: "A sudden, usually temporary malfunction or fault in equipment.", url: "http://catb.org/jargon/html/G/glitch.html" },
    { term: "Hacker", preview: "A person who enjoys exploring the limits of what is possible.", url: "http://catb.org/jargon/html/H/hacker.html" },
    { term: "Magic", preview: "Code that works but whose operation is not immediately obvious.", url: "http://catb.org/jargon/html/M/magic.html" },
    { term: "Nerd", preview: "A person who is extremely interested in a technical subject.", url: "http://catb.org/jargon/html/N/nerd.html" },
    { term: "Patch", preview: "A piece of software designed to update a computer program.", url: "http://catb.org/jargon/html/P/patch.html" },
    { term: "Spam", preview: "Irrelevant or unsolicited messages sent over the internet.", url: "http://catb.org/jargon/html/S/spam.html" },
    { term: "Troll", preview: "A person who starts quarrels or upsets people on the internet.", url: "http://catb.org/jargon/html/T/troll.html" },
    { term: "Wizard", preview: "A person who is extremely skilled in a particular field.", url: "http://catb.org/jargon/html/W/wizard.html" }
  ];

  /**
   * Initialize terminal data on mount.
   * Fetches posts, extracts tags, and sets up the initial ASCII art
   * and welcome message.
   */
  useEffect(() => {
    fetch('/api/posts.json')
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
          "NEW: Type 'ai [prompt]' to chat with the AI assistant!",
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
      className="neobrutal-box glass-terminal w-full flex flex-col p-4 font-mono text-sm md:text-base relative overflow-hidden transition-colors duration-300 cursor-grab active:cursor-grabbing"
      initialHeight={400}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="absolute top-0 left-0 right-0 h-6 bg-neon-pink flex items-center px-2 justify-between transition-colors duration-300 z-10 pointer-events-none">
        <span className="text-void font-bold text-xs">
          {activeApp === 'snake' ? 'SNAKE // PYTHON' :
           activeApp === 'win96' ? 'WINDOWS 96 // MIKESOFT' :
           activeApp === 'win98' ? 'WINDOWS 98 // REDMOND' :
           activeApp === 'linux' ? 'LINUX // WEBVM' :
           activeApp === 'linux-gui' ? 'LINUX // GUI' :
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
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'win98' ? (
            <iframe 
              src="https://98.js.org/"
              className="w-full h-full border-none" 
              title="Windows 98"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'win93' ? (
            <iframe 
              src="https://www.windows93.net/"
              className="w-full h-full border-none" 
              title="Windows 93"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'emshell' ? (
            <iframe 
              src="https://tbfleming.github.io/em-shell/"
              className="w-full h-full border-none" 
              title="Emscripten Shell"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'linux' ? (
            <iframe 
              src="https://webvm.io/"
              className="w-full h-full border-none" 
              title="linux"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'linux-gui' ? (
            <iframe 
              ref={linuxRef}
              src="https://webvm.io/alpine.html"
              className="w-full h-full border-none" 
              title="linux-gui"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : activeApp === 'doom' ? (
            <iframe 
              ref={doomRef}
              src="https://ustymukhman.github.io/webDOOM/public/"
              className="w-full h-full border-none" 
              title="DOOM"
              allow="autoplay; fullscreen; microphone; camera; midi; encrypted-media; cross-origin-isolated"
            />
          ) : null}
        </div>
      ) : (
        <>
          <div 
            className="mt-6 flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2 select-text cursor-text" 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => inputRef.current?.focus()}
          >
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
              ref={inputRef}
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
