import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_CONFIG } from '../constants';

interface SiteConfig {
  siteName: string;
  author: string;
  footerText: string;
  heroTitle: string;
  heroDescription: string;
  bannerMessage?: string;
  bannerStart?: string;
  bannerEnd?: string;
  favicon?: string;
  siteIcon?: string;
}

interface SiteConfigContextType {
  config: SiteConfig;
  refreshConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType>({
  config: DEFAULT_CONFIG,
  refreshConfig: async () => {},
});

export const useSiteConfig = () => useContext(SiteConfigContext);

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/config.json`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Failed to fetch site config", error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SiteConfigContext.Provider value={{ config, refreshConfig: fetchConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};
