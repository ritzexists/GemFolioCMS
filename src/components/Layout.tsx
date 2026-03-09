import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, BookOpen, User, Settings, Home, Star, RectangleGoggles, HardHat, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteConfig } from '@/context/SiteConfigContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { config } = useSiteConfig();

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

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-4 border-neon-pink bg-void sticky top-0 z-50">
        {showBanner && (
          <div className="bg-neon-pink text-void text-center py-2 font-bold uppercase text-sm">
            {config.bannerMessage}
          </div>
        )}
        <div className="flex justify-between items-stretch">
          <div className="flex items-center px-6 py-4 border-r-4 border-neon-pink bg-neon-green text-void">
            <Terminal size={24} className="mr-2" />
            <span className="font-black text-xl tracking-tighter uppercase">{config.siteName}</span>
          </div>
          
          <nav className="flex-1 flex overflow-x-auto">
            <NavItem to="/" icon={Home} label="Home" />
            <NavItem to="/blog" icon={BookOpen} label="Blog" />
            <NavItem to="/p/recs" icon={Star} label="Recs" />
            <NavItem to="/p/portfolio" icon={WorksIcon} label="Works" />
            <NavItem to="/p/hubs" icon={RectangleGoggles} label="Hubs" />
            <NavItem to="/profile" icon={User} label="Profile" />
            <NavItem to="/admin" icon={Settings} label="Admin" />
          </nav>
          
          <div className="hidden md:flex items-center px-6 border-l-2 border-neon-pink">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse" />
            <span className="text-xs uppercase text-neon-pink">System Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {!location.pathname.startsWith('/admin') && (
        <footer className="border-t-4 border-neon-pink p-6 text-center text-xs uppercase text-white/50">
          <p>{config.footerText} // {new Date().getFullYear()}</p>
        </footer>
      )}
    </div>
  );
}
