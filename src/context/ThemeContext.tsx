import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'nonbinary' | 'demi' | 'pan' | 'transgender' | 'lesbian' | 'hddvd' | 'bluray' | 'brat' | 'frutiger-aero' | 'paper';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: Record<Theme, { primary: string; secondary: string; bg: string; palette: string[] }> = {
  nonbinary: {
    primary: '#FCF434', // Yellow
    secondary: '#9C59D1', // Purple
    bg: '#2C2C2C', // Dark Gray
    palette: ['#FCF434', '#FFFFFF', '#9C59D1', '#2C2C2C']
  },
  demi: {
    primary: '#D3D3D3', // Silver/Gray
    secondary: '#6E0070', // Purple
    bg: '#000000', // Black
    palette: ['#000000', '#FFFFFF', '#6E0070', '#D3D3D3']
  },
  pan: {
    primary: '#FF218C', // Pink
    secondary: '#21B1FF', // Blue
    bg: '#121212', // Dark
    palette: ['#FF218C', '#FFD800', '#21B1FF']
  },
  transgender: {
    primary: '#5BCEFA', // Blue
    secondary: '#F5A9B8', // Pink
    bg: '#09090b', // Void
    palette: ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA']
  },
  lesbian: {
    primary: '#FF9A56', // Light Orange
    secondary: '#D362A4', // Pink
    bg: '#2D0018', // Dark Rose/Brown
    palette: ['#D52D00', '#FF9A56', '#FFFFFF', '#D362A4', '#A30262']
  },
  hddvd: {
    primary: '#09F911', // Green
    secondary: '#E35BD8', // Pink
    bg: '#101010', // Dark
    palette: ['#09F911', '#029D74', '#E35BD8', '#4156C5', '#635688']
  },
  bluray: {
    primary: '#CB3D62', // Pinkish Red
    secondary: '#298069', // Teal
    bg: '#150a0a', // Dark
    palette: ['#CB3D62', '#298069', '#157709', '#98B3E5', '#E94242']
  },
  brat: {
    primary: '#8ACE00', // Brat Green
    secondary: '#FFFFFF', // White
    bg: '#000000', // Black
    palette: ['#8ACE00', '#FFFFFF', '#000000', '#8ACE00', '#FFFFFF']
  },
  'frutiger-aero': {
    primary: '#00A8FF', // Glossy Blue
    secondary: '#7CFC00', // Lush Green
    bg: '#001F3F', // Deep Ocean Blue
    palette: ['#00A8FF', '#7CFC00', '#FFFFFF', '#001F3F', '#4DD0E1']
  },
  paper: {
    primary: '#000000',
    secondary: '#444444',
    bg: '#FFFFFF',
    palette: ['#000000', '#222222', '#444444', '#666666', '#FFFFFF']
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('nonbinary');

  // Helper to manage cookies
  const setCookie = (name: string, value: string, days: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  useEffect(() => {
    // Check for daily theme cookie
    const today = new Date().toDateString();
    const storedDate = getCookie('theme_date');
    const storedTheme = getCookie('daily_theme') as Theme;

    if (storedDate === today && storedTheme && themes[storedTheme]) {
      setTheme(storedTheme);
    } else {
      // Automatic detection for E-readers, Braille readers, or High Contrast modes
      const isHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
      const isForcedColors = window.matchMedia('(forced-colors: active)').matches;
      const isEReader = /Kindle|Kobo|PocketBook|Onyx|reMarkable|Silk/i.test(navigator.userAgent);
      
      if (isHighContrast || isForcedColors || isEReader) {
        setTheme('paper');
        return;
      }

      // Pick a new random theme for the day (excluding specific themes)
      const themeKeys = Object.keys(themes) as Theme[];
      const excludedFromRandom = ['frutiger-aero', 'paper'];
      const randomPool = themeKeys.filter(t => !excludedFromRandom.includes(t));
      const randomTheme = randomPool[Math.floor(Math.random() * randomPool.length)];
      
      setTheme(randomTheme);
      
      // Store in cookie
      setCookie('theme_date', today, 1);
      setCookie('daily_theme', randomTheme, 1);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const colors = themes[theme];
    
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-bg', colors.bg);

    // Set palette variables
    colors.palette.forEach((color, index) => {
      root.style.setProperty(`--theme-color-${index + 1}`, color);
    });

    // Set data-theme attribute for CSS targeting
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const cycleTheme = () => {
    const themeKeys = Object.keys(themes) as Theme[];
    const currentIndex = themeKeys.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];
    setTheme(nextTheme);
    return nextTheme;
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { themes }; // Export themes for external use

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
