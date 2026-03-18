import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '../context/SiteConfigContext';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
}

export default function SEO({ title, description, canonical }: SEOProps) {
  const { config } = useSiteConfig();
  const siteTitle = config.siteName;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const siteDescription = description || config.heroDescription;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={siteDescription} />
      <meta name="author" content={config.author} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:type" content="article" />
      <meta property="article:author" content={config.author} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
