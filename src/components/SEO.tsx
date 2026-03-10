import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
}

export default function SEO({ title, description, canonical }: SEOProps) {
  const siteTitle = 'Neobrutalism Template';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const siteDescription = description || 'A modern, high-performance portfolio and blog template built with React, Vite, and Tailwind CSS.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={siteDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
    </Helmet>
  );
}
