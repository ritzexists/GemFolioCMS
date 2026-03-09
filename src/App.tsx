/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, Monitor, Gamepad2, Command, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppType = 'terminal' | 'doom' | 'emshell';

interface WindowState {
  id: string;
  type: AppType;
  title: string;
  isMinimized: boolean;
  zIndex: number;
}

export default function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(10);

  const openWindow = (type: AppType) => {
    const id = Math.random().toString(36).substring(7);
    const titles: Record<AppType, string> = {
      terminal: 'Terminal',
      doom: 'DOOM',
      emshell: 'BusyBox (em-shell)'
    };
    
    const newWindow: WindowState = {
      id,
      type,
      title: titles[type],
      isMinimized: false,
      zIndex: nextZIndex
    };
    
    setWindows([...windows, newWindow]);
    setActiveWindowId(id);
    setNextZIndex(nextZIndex + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    setWindows(windows.map(w => 
      w.id === id ? { ...w, zIndex: nextZIndex, isMinimized: false } : w
    ));
    setNextZIndex(nextZIndex + 1);
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w => 
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    setActiveWindowId(null);
  };

  return (
    <div className="h-screen w-screen bg-[#FF6B6B] overflow-hidden font-mono selection:bg-black selection:text-white">
      {/* Desktop Icons */}
      <div className="p-8 grid grid-cols-1 gap-8 w-fit">
        <DesktopIcon 
          icon={<TerminalIcon size={32} />} 
          label="Terminal" 
          onClick={() => openWindow('terminal')} 
          color="bg-[#4ECDC4]"
        />
        <DesktopIcon 
          icon={<Gamepad2 size={32} />} 
          label="DOOM" 
          onClick={() => openWindow('doom')} 
          color="bg-[#FFE66D]"
        />
        <DesktopIcon 
          icon={<Monitor size={32} />} 
          label="BusyBox" 
          onClick={() => openWindow('emshell')} 
          color="bg-[#FF9FF3]"
        />
      </div>

      {/* Windows */}
      <AnimatePresence>
        {windows.map((win) => (
          !win.isMinimized && (
            <Window 
              key={win.id}
              window={win}
              isActive={activeWindowId === win.id}
              onClose={() => closeWindow(win.id)}
              onFocus={() => focusWindow(win.id)}
              onMinimize={() => minimizeWindow(win.id)}
              openWindow={openWindow}
            />
          )
        ))}
      </AnimatePresence>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white border-t-4 border-black flex items-center px-4 gap-2 z-[9999]">
        <button 
          className="bg-black text-white px-4 py-1 font-bold border-2 border-black hover:bg-white hover:text-black transition-colors"
          onClick={() => openWindow('terminal')}
        >
          START
        </button>
        <div className="h-8 w-1 bg-black mx-2" />
        {windows.map(win => (
          <button
            key={win.id}
            onClick={() => focusWindow(win.id)}
            className={`px-4 py-1 border-2 border-black font-bold transition-all ${
              activeWindowId === win.id 
                ? 'bg-black text-white translate-y-[-2px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            {win.title}
          </button>
        ))}
      </div>
    </div>
  );
}

function DesktopIcon({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`${color} p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all`}>
        {icon}
      </div>
      <span className="bg-white px-2 border-2 border-black font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        {label}
      </span>
    </button>
  );
}

interface WindowProps {
  key?: string;
  window: WindowState;
  isActive: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  openWindow: (type: AppType) => void;
}

function Window({ window, isActive, onClose, onFocus, onMinimize, openWindow }: WindowProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      drag
      dragMomentum={false}
      onMouseDown={onFocus}
      style={{ zIndex: window.zIndex }}
      className={`absolute top-20 left-40 min-w-[600px] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col ${isActive ? 'ring-4 ring-black/10' : ''}`}
    >
      {/* Title Bar */}
      <div className={`h-10 border-b-4 border-black flex items-center justify-between px-4 cursor-move ${isActive ? 'bg-[#4ECDC4]' : 'bg-gray-200'}`}>
        <span className="font-bold uppercase tracking-tighter">{window.title}</span>
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); onMinimize(); }} className="p-1 border-2 border-black bg-white hover:bg-gray-100"><Minimize2 size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 border-2 border-black bg-[#FF6B6B] text-white hover:bg-red-600"><X size={16} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white overflow-hidden relative" style={{ height: window.type === 'terminal' ? '400px' : '500px' }}>
        {window.type === 'terminal' && <Terminal openWindow={openWindow} />}
        {window.type === 'doom' && <DoomIframe />}
        {window.type === 'emshell' && <EmShellIframe />}
      </div>
    </motion.div>
  );
}

function Terminal({ openWindow }: { openWindow: (type: AppType) => void }) {
  const [history, setHistory] = useState<string[]>(['Welcome to NeoBrutal Terminal v1.0', 'Type "help" for a list of commands.']);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    setHistory(prev => [...prev, `> ${input}`]);
    setInput('');

    switch (cmd) {
      case 'help':
        setHistory(prev => [...prev, 'Available commands:', '  doom     - Launch DOOM (WebDOOM)', '  emshell  - Launch em-shell (BusyBox)', '  busybox  - Launch em-shell (BusyBox)', '  clear    - Clear terminal', '  exit     - Close terminal']);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'doom':
        setHistory(prev => [...prev, 'Launching DOOM...']);
        openWindow('doom');
        break;
      case 'emshell':
      case 'busybox':
        setHistory(prev => [...prev, 'Launching BusyBox...']);
        openWindow('emshell');
        break;
      case 'exit':
        // In a real app we'd need to pass the close function
        setHistory(prev => [...prev, 'Use the window controls to exit.']);
        break;
      default:
        setHistory(prev => [...prev, `Command not found: ${cmd}`]);
    }
  };

  return (
    <div className="h-full bg-black text-[#00FF00] p-4 font-mono text-sm overflow-hidden flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto mb-2 scrollbar-hide">
        {history.map((line, i) => (
          <div key={i} className="mb-1 whitespace-pre-wrap">{line}</div>
        ))}
      </div>
      <form onSubmit={handleCommand} className="flex items-center">
        <span className="mr-2 text-[#4ECDC4] font-bold">neo@brutal:~$</span>
        <input 
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none border-none text-[#00FF00]"
        />
      </form>
    </div>
  );
}

function DoomIframe() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const grabMouse = () => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      // Attempt to request pointer lock if possible (though browser security might block it without direct user interaction inside the iframe)
      try {
        iframeRef.current.contentWindow?.postMessage('requestPointerLock', '*');
      } catch (e) {
        // Ignore cross-origin errors
      }
    }
  };

  return (
    <div className="w-full h-full bg-black flex flex-col group">
      <div className="bg-black border-b-2 border-white/20 p-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={grabMouse}
          className="text-[10px] bg-white border-2 border-black px-3 py-0.5 hover:bg-[#FFE66D] font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-y-[1px]"
        >
          CLICK TO GRAB MOUSE
        </button>
      </div>
      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef}
          src="https://ustymukhman.github.io/webDOOM/public/" 
          className="w-full h-full border-none"
          title="DOOM"
          allow="autoplay; fullscreen; pointer-lock"
          onClick={grabMouse}
        />
      </div>
    </div>
  );
}

function EmShellIframe() {
  return (
    <iframe 
      src="https://em-shell.github.io/" 
      className="w-full h-full border-none"
      title="BusyBox"
      allow="autoplay; fullscreen"
    />
  );
}
