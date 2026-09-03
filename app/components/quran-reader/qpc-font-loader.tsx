'use client';

import React from 'react';

interface QPCFontLoaderProps {
  pages: number[];
  mushafLayout?: 'v1' | 'v4';
}

export default function QPCFontLoader({ pages, mushafLayout = 'v1' }: QPCFontLoaderProps) {
  if (!pages || pages.length === 0) return null;
  
  // Deduplicate pages
  const uniquePages = Array.from(new Set(pages)).filter(p => p > 0);

  const getFontUrl = (page: number) =>
    mushafLayout === 'v4'
      ? `https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/v4-tajweed/woff2/p${page}.woff2?v=3.1`
      : `https://static-cdn.tarteel.ai/qul/fonts/quran_fonts/v1-optimized/woff2/p${page}.woff2`;

  return (
    <>
      {/* High-priority browser font preloading */}
      {uniquePages.slice(0, 6).map((page) => (
        <link
          key={`preload-font-${page}`}
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href={getFontUrl(page)}
        />
      ))}

      <style dangerouslySetInnerHTML={{ __html: `
        ${uniquePages.map(page => `
          @font-face {
            font-family: 'QPC_Page_${page}';
            src: url('${getFontUrl(page)}') format('woff2');
            font-display: swap;
          }
          .qpc-page-${page} {
            font-family: 'QPC_Page_${page}', sans-serif !important;
          }
        `).join('\n')}
      `}} />
    </>
  );
}
