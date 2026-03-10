import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
}

export default function SEO({ title, description, canonical }: SEOProps) {
  const siteTitle = 'GemBrutalCMS';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const siteDescription = description || 'A femme maximalist neobrutalist static-site-generator-style CMS with markdown file backing, admin dashboard, and terminal aesthetics.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={siteDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
