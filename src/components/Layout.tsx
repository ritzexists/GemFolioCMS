import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, BookOpen, User, Settings, Home, Star, RectangleGoggles, HardHat, Wrench, Mic, Rss, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteConfig } from '@/context/SiteConfigContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { config } = useSiteConfig();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const now = new Date("2026-03-09T15:48:34-07:00");
  const showBanner = config.bannerMessage && 
                     (!config.bannerStart || now >= new Date(config.bannerStart)) &&
                     (!config.bannerEnd || now <= new Date(config.bannerEnd));

  const WorksIcon = ({ size, ...props }: any) => (
    <div className="flex items-center gap-0.5" {...props}>
      <Wrench size={size} />
      <HardHat size={size} />
    </div>
  );

  const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-4 py-2 border-r-2 border-b-2 border-neon-pink hover:bg-neon-pink hover:text-void transition-colors",
          isActive && "bg-neon-pink text-void"
        )}
      >
        <Icon size={18} />
        <span className="uppercase font-bold text-sm">{label}</span>
      </Link>
    );
  };

  const MobileNavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={cn(
          "flex items-center gap-4 px-6 py-4 border-b-2 border-neon-pink hover:bg-neon-pink hover:text-void transition-colors w-full",
          isActive && "bg-neon-pink text-void"
        )}
      >
        <Icon size={20} />
        <span className="uppercase font-black text-lg">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-4 border-neon-pink bg-void sticky top-0 z-50">
        {showBanner && (
          <div className="bg-neon-pink text-void text-center py-2 font-bold uppercase text-sm">
            {config.bannerMessage}
          </div>
        )}
        <div className="flex justify-between items-stretch h-16 md:h-20">
          <Link to="/" className="flex items-center px-4 md:px-6 border-r-4 border-neon-pink bg-neon-green text-void hover:bg-white transition-colors">
            <Terminal size={24} className="mr-2 shrink-0" />
            <span className="font-black text-lg md:text-xl tracking-tighter uppercase truncate max-w-[150px] md:max-w-none">{config.siteName}</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden min-[1152px]:flex flex-1 overflow-x-auto landscape:flex">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/blog" icon={BookOpen} label="Blog" />
            <NavItem to="/p/recs" icon={Star} label="Recs" />
            <NavItem to="/p/presentations" icon={Mic} label="Talks" />
            <NavItem to="/p/portfolio" icon={WorksIcon} label="Works" />
            <NavItem to="/p/hubs" icon={RectangleGoggles} label="Hubs" />
            <NavItem to="/profile" icon={User} label="Profile" />
            <NavItem to="/admin" icon={Settings} label="Admin" />
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex min-[1152px]:hidden items-center px-6 border-l-2 border-neon-pink text-neon-pink hover:bg-neon-pink hover:text-void transition-colors ml-auto landscape:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="hidden min-[1152px]:flex items-center px-6 border-l-2 border-neon-pink">
            <div className="w-3 h-3 bg-neon-green rounded-full mr-2 animate-pulse" />
            <span className="text-xs uppercase text-neon-green">System Online</span>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-auto bottom-0 h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] bg-void z-40 flex flex-col overflow-y-auto border-t-4 border-neon-pink animate-in slide-in-from-bottom duration-300 min-[1152px]:hidden landscape:hidden">
            <div className="flex flex-col">
              <MobileNavItem to="/" icon={Home} label="Home" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/blog" icon={BookOpen} label="Blog" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/p/recs" icon={Star} label="Recs" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/p/presentations" icon={Mic} label="Talks" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/p/portfolio" icon={WorksIcon} label="Works" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/p/hubs" icon={RectangleGoggles} label="Hubs" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/profile" icon={User} label="Profile" onClick={() => setIsMenuOpen(false)} />
              <MobileNavItem to="/admin" icon={Settings} label="Admin" onClick={() => setIsMenuOpen(false)} />
            </div>
            
            <div className="p-8 mt-auto bg-neon-pink/5 border-t-2 border-neon-pink">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse" />
                <span className="text-sm font-black uppercase text-neon-green tracking-widest">System Status: Nominal</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {!location.pathname.startsWith('/admin') && (
        <footer className="border-t-4 border-neon-pink p-6 text-center text-xs uppercase text-white/50">
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 md:gap-4">
            <p>{config.footerText}</p>
            <span className="hidden md:inline text-white/20">|</span>
            <a 
              href="/rss.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-neon-pink transition-colors flex items-center gap-1"
              title="RSS Feed"
            >
              <Rss size={14} />
              <span>RSS FEED</span>
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
