'use client';

import React from 'react';

interface GeometricPatternProps {
  showOverlay?: boolean;
  fixed?: boolean;
  className?: string;
}

export default function GeometricPattern({ showOverlay = true, fixed = false, className = '' }: GeometricPatternProps) {
  return (
    <div className={`patternBg ${fixed ? 'fixed' : ''} ${className}`}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="islamic-pattern"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 40 L40 0 L80 40 L40 80 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle cx="40" cy="40" r="8" fill="currentColor" opacity="0.5" />
            <rect
              x="38"
              y="38"
              width="4"
              height="4"
              transform="rotate(45 40 40)"
              fill="currentColor"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
      {showOverlay && <div className="patternOverlay"></div>}
    </div>
  );
}
