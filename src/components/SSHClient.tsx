import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface SSHClientProps {
  onExit: () => void;
  initialHost?: string;
  initialUser?: string;
}

export default function SSHClient({ onExit, initialHost = '', initialUser = '' }: SSHClientProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const [host, setHost] = useState(initialHost);
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState(initialUser);
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  const connect = () => {
    if (!host || !username) {
      setError('Host and Username are required');
      return;
    }

    setStatus('connecting');
    setError(null);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ssh`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'ssh-connect',
        data: { host, port: parseInt(port), username, password, privateKey }
      }));
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'ssh-status') {
        if (message.data === 'CONNECTED') {
          setStatus('connected');
          initTerminal();
        } else if (message.data === 'DISCONNECTED') {
          setStatus('idle');
          if (xtermRef.current) {
            xtermRef.current.write('\r\nConnection closed.\r\n');
          }
        }
      } else if (message.type === 'ssh-data') {
        if (xtermRef.current) {
          xtermRef.current.write(message.data);
        }
      } else if (message.type === 'ssh-error') {
        setStatus('error');
        setError(message.data);
        if (xtermRef.current) {
          xtermRef.current.write(`\r\nError: ${message.data}\r\n`);
        }
      }
    };

    socket.onclose = () => {
      setStatus('idle');
    };

    socket.onerror = () => {
      setStatus('error');
      setError('WebSocket error');
    };
  };

  const initTerminal = () => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      theme: {
        background: '#00000000', // Transparent to show parent background
        foreground: '#00ff00',
        cursor: '#ff00ff',
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ssh-input', data }));
      }
    });

    term.onResize((size) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ssh-resize', data: { rows: size.rows, cols: size.cols } }));
      }
    });

    window.addEventListener('resize', () => fitAddon.fit());
    
    xtermRef.current = term;
    
    // Initial resize
    socketRef.current?.send(JSON.stringify({ 
      type: 'ssh-resize', 
      data: { rows: term.rows, cols: term.cols } 
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-neon-green font-mono p-2 overflow-hidden">
      {status !== 'connected' ? (
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          <div className="flex gap-3 max-w-2xl w-full items-center">
            <div className="flex-1 flex flex-col space-y-2 overflow-y-auto max-h-full pr-1 custom-scrollbar">
              <div className="w-full space-y-1">
                <label className="block text-[10px] uppercase opacity-70 tracking-widest">Host</label>
                <input 
                  type="text" 
                  value={host} 
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full bg-void/50 border border-neon-green/50 p-2 outline-none focus:border-neon-pink transition-colors text-sm"
                  placeholder="example.com"
                />
              </div>
              <div className="w-full flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="block text-[10px] uppercase opacity-70 tracking-widest">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-void/50 border border-neon-green/50 p-2 outline-none focus:border-neon-pink transition-colors text-sm"
                    placeholder="root"
                  />
                </div>
                <div className="w-20 space-y-1">
                  <label className="block text-[10px] uppercase opacity-70 tracking-widest">Port</label>
                  <input 
                    type="text" 
                    value={port} 
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-void/50 border border-neon-green/50 p-2 outline-none focus:border-neon-pink transition-colors text-sm"
                    placeholder="22"
                  />
                </div>
              </div>
              <div className="w-full space-y-1">
                <label className="block text-[10px] uppercase opacity-70 tracking-widest">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-void/50 border border-neon-green/50 p-2 outline-none focus:border-neon-pink transition-colors text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="w-full space-y-1">
                <label className="block text-[10px] uppercase opacity-70 tracking-widest">Private Key (Optional)</label>
                <textarea 
                  value={privateKey} 
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="w-full bg-void/50 border border-neon-green/50 p-2 outline-none focus:border-neon-pink transition-colors h-16 text-[10px] resize-none"
                  placeholder="-----BEGIN RSA PRIVATE KEY-----"
                />
              </div>
              
              {error && <div className="text-red-500 text-[10px] bg-red-500/10 p-1 border border-red-500/50 w-full text-center uppercase">{error}</div>}
            </div>
            
            <button 
              onClick={connect}
              disabled={status === 'connecting'}
              className="w-12 self-stretch my-1 bg-neon-green text-void font-bold hover:bg-neon-pink transition-colors disabled:opacity-50 text-[10px] uppercase tracking-widest flex items-center justify-center [writing-mode:vertical-rl] rotate-180 border border-neon-green/50"
            >
              {status === 'connecting' ? 'CONNECTING...' : 'CONNECT'}
            </button>
          </div>
        </div>
      ) : (
        <div ref={terminalRef} className="flex-1 w-full overflow-hidden" />
      )}
    </div>
  );
}
