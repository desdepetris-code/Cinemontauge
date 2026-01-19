import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto" }) => {
  return (
    <svg 
      className={className}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Lens Housing */}
      <circle cx="50" cy="50" r="48" fill="black" stroke="#4169E1" strokeWidth="1" />
      
      {/* Aperture Shutter Blades */}
      <path d="M50 2L65 30H35L50 2Z" fill="#4169E1" opacity="0.4" />
      <path d="M98 50L70 65V35L98 50Z" fill="#4169E1" opacity="0.4" />
      <path d="M50 98L35 70H65L50 98Z" fill="#4169E1" opacity="0.4" />
      <path d="M2 50L30 35V65L2 50Z" fill="#4169E1" opacity="0.4" />
      
      {/* Inner Lens / Glass */}
      <circle cx="50" cy="50" r="32" fill="black" stroke="#4169E1" strokeWidth="2" />
      
      {/* CM Monogram */}
      <text 
        x="50%" 
        y="62" 
        fontFamily="Arial Black, sans-serif" 
        fontSize="28" 
        fontWeight="900" 
        fill="white" 
        textAnchor="middle"
        letterSpacing="-1"
      >
        C
        <tspan fill="#4169E1">M</tspan>
      </text>
      
      {/* Lens Flare Highlight */}
      <circle cx="35" cy="35" r="4" fill="white" opacity="0.3" />
    </svg>
  );
};

export default Logo;