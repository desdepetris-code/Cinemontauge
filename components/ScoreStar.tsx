import React from 'react';

interface ScoreStarProps {
  score: number; // A score from 0 to 10
  voteCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const getScoreStyle = (percentage: number): { strokeColor: string; solidColor: string; } => {
    // Colors updated to be brighter and more vibrant for high contrast on dark backgrounds
    if (percentage <= 20) return { strokeColor: '#FF4D4D', solidColor: '#FF4D4D' }; // Bright Red-Orange
    if (percentage <= 40) return { strokeColor: '#FF8C42', solidColor: '#FF8C42' }; // Bright Orange
    if (percentage <= 50) return { strokeColor: 'url(#gold-gradient)', solidColor: '#FFD700' }; // Gold
    if (percentage <= 60) return { strokeColor: 'url(#silver-gradient)', solidColor: '#E0E0E0' }; // Light Silver
    if (percentage <= 70) return { strokeColor: '#B2FF59', solidColor: '#B2FF59' }; // Light Lime
    if (percentage <= 80) return { strokeColor: '#64FFDA', solidColor: '#64FFDA' }; // Bright Aquamarine
    if (percentage <= 90) return { strokeColor: '#18FFFF', solidColor: '#18FFFF' }; // Electric Cyan
    return { strokeColor: '#FFFFFF', solidColor: '#FFFFFF' }; // Pure White for top tier
};

const ScoreStar: React.FC<ScoreStarProps> = ({ score, voteCount, size = 'md', className = '' }) => {
  if (!score || score <= 0) return null;
  const percentage = Math.round(score * 10);

  const sizeConfig = {
    xs: { container: 'w-8 h-8', text: 'text-xs', stroke: 3, radius: 15 },
    sm: { container: 'w-10 h-10', text: 'text-sm', stroke: 3, radius: 15 },
    md: { container: 'w-16 h-16', text: 'text-xl', stroke: 2.5, radius: 15 },
    lg: { container: 'w-20 h-20', text: 'text-2xl', stroke: 2, radius: 15 },
  };

  const { container, text, stroke, radius } = sizeConfig[size];
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (percentage / 100) * circumference;

  const { strokeColor, solidColor } = getScoreStyle(percentage);
  
  const title = `User score: ${percentage}%` + (voteCount ? ` based on ${voteCount} votes` : '');
  
  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${container} ${className}`} title={title}>
      {/* Background circle */}
      <div className="absolute inset-0 bg-black/40 rounded-full"></div>

      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FFE082" />
            </linearGradient>
            <linearGradient id="silver-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#BDBDBD" />
                <stop offset="100%" stopColor="#F5F5F5" />
            </linearGradient>
        </defs>
          {/* Track */}
          <circle
            className="text-white/10"
            cx="18"
            cy="18"
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
      </svg>

      <div
        className={`absolute font-black ${text}`}
        style={{ color: solidColor, textShadow: '0 0 10px rgba(0,0,0,0.5)' }}
      >
        {percentage}<span className="text-[0.6em] align-super">%</span>
      </div>
    </div>
  );
};

export default ScoreStar;