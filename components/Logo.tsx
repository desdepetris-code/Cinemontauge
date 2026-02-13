import React, { forwardRef } from 'react';

interface LogoProps {
  className?: string;
  id?: string;
}

const Logo = forwardRef<SVGSVGElement, LogoProps>(({ className = "h-8 w-auto", id }, ref) => {
  return (
    <svg 
      ref={ref}
      id={id}
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Main Directions Gradients */}
        <linearGradient id="grad-n" x1="50" y1="2" x2="50" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="grad-e" x1="98" y1="50" x2="75" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C1D95" />
          <stop offset="100%" stopColor="#F5D0FE" />
        </linearGradient>
        <linearGradient id="grad-s" x1="50" y1="98" x2="50" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#450a0a" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="grad-w" x1="2" y1="50" x2="25" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        {/* 7-Stop Dark Mixing Gradient for Inner Ring */}
        <linearGradient id="grad-dark-ring-complex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="15%" stopColor="#1e1b4b" />
          <stop offset="30%" stopColor="#450a0a" />
          <stop offset="50%" stopColor="#0f172a" />
          <stop offset="65%" stopColor="#312e81" />
          <stop offset="85%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>

        {/* Monogram Text Gradient */}
        <linearGradient id="grad-text-si-complex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="25%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="75%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Silver Star Gradient */}
        <linearGradient id="grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="40%" stopColor="#CBD5E1" />
          <stop offset="60%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        
        {/* Sleek Line Gradient */}
        <linearGradient id="grad-sleek-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%" stopColor="white" />
          <stop offset="80%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      {/* Outer Lens Housing */}
      <circle cx="50" cy="50" r="48" fill="black" stroke="#111" strokeWidth="0.5" />
      
      {/* 4 Compass Points */}
      <path d="M50 2L58 20H42L50 2Z" fill="url(#grad-n)" />
      <path d="M98 50L80 58V42L98 50Z" fill="url(#grad-e)" />
      <path d="M50 98L42 80H58L50 98Z" fill="url(#grad-s)" />
      <path d="M2 50L20 42V58L2 50Z" fill="url(#grad-w)" />
      
      {/* Inner Ring */}
      <circle cx="50" cy="50" r="37" fill="black" stroke="url(#grad-dark-ring-complex)" strokeWidth="2.5" />
      
      {/* Silver Star */}
      <path 
        d="M50 18L51.5 22.5H56L52.5 25L54 29.5L50 27L46 29.5L47.5 25L44 22.5H48.5L50 18Z" 
        fill="url(#grad-silver)" 
        filter="drop-shadow(0 0 2px rgba(255,255,255,0.4))"
      />

      {/* CM Monogram */}
      <text 
        x="50%" 
        y="50" 
        fontFamily="Arial Black, sans-serif" 
        fontSize="24" 
        fontWeight="900" 
        fill="url(#grad-text-si-complex)" 
        textAnchor="middle"
        letterSpacing="-1"
      >
        CM
      </text>

      {/* Upper Sleek Line */}
      <rect 
        x="28" 
        y="58" 
        width="44" 
        height="0.5" 
        fill="url(#grad-sleek-line)" 
        opacity="0.8"
      />
      <path d="M50 57.5L51 58.5L50 59.5L49 58.5Z" fill="white" opacity="0.6" />

      {/* Spelled out name */}
      <text
        x="50%"
        y="68"
        fontFamily="Arial Black, sans-serif"
        fontSize="5"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        letterSpacing="1.2"
      >
        CineMontauge
      </text>
      
      {/* Lower Sleek Line */}
      <rect 
        x="28" 
        y="72" 
        width="44" 
        height="0.5" 
        fill="url(#grad-sleek-line)" 
        opacity="0.8"
      />
      <path d="M50 71.5L51 72.5L50 73.5L49 72.5Z" fill="white" opacity="0.6" />
    </svg>
  );
});

export default Logo;