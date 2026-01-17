import React from 'react';

interface NewReleaseOverlayProps {
    text?: string;
    position?: 'top-left' | 'top-right' | 'static';
    color?: 'cyan' | 'rose';
    className?: string;
}

export const NewReleaseOverlay: React.FC<NewReleaseOverlayProps> = ({ text = 'NEW', position = 'top-left', color = 'cyan', className = '' }) => {
    const positionClass = 
        position === 'top-left' ? 'absolute top-2 left-2' : 
        position === 'top-right' ? 'absolute top-2 right-2' : 
        '';
    
    const colorClass = color === 'cyan' ? 'bg-cyan-600/80' : 'bg-rose-600/80';
    
    return (
        <div className={`${positionClass} px-2 py-1 ${colorClass} text-white text-[9px] font-black uppercase tracking-widest rounded-md backdrop-blur-md shadow-lg z-10 border border-white/10 ${className}`}>
            {text}
        </div>
    );
};