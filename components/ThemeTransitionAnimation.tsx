import React, { useEffect, useState, useMemo } from 'react';
import { Theme } from '../types';

type ParticleEffect = Theme['colors']['particleEffect'];

interface ThemeTransitionAnimationProps {
  effect: ParticleEffect | null;
  onAnimationEnd: () => void;
}

const transitionParticleConfig = {
    snow: { content: '❄️', count: 50 },
    hearts: { content: '❤️', count: 40 },
    leaves: { content: ['🍂', '🍁'], count: 40 },
    confetti: { content: ['🎉', '🎊', '✨'], count: 60 },
    fireworks: { content: ['🎆', '🎇'], count: 30 },
    sparkles: { content: '✨', count: 60 },
    bats: { content: '🦇', count: 40 },
    flowers: { content: ['🌸', '🌼', '🌷'], count: 40 },
    pumpkins: { content: '🎃', count: 30 },
};

const ThemeTransitionAnimation: React.FC<ThemeTransitionAnimationProps> = ({ effect, onAnimationEnd }) => {
    const [particles, setParticles] = useState<any[]>([]);

    const config = useMemo(() => {
        if (!effect) return null;
        return transitionParticleConfig[effect];
    }, [effect]);

    useEffect(() => {
        if (!config) return;
        
        const newParticles = Array.from({ length: config.count }).map((_, i) => {
            const content = Array.isArray(config.content) 
                ? config.content[i % config.content.length]
                : config.content;

            return {
                id: i,
                content,
                style: {
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 1.5 + 1}s`, // 1-2.5s duration
                    animationDelay: `${Math.random() * 0.5}s`, // Staggered start
                    fontSize: `${Math.random() * 1.5 + 1}rem`,
                    '--i': i,
                } as React.CSSProperties,
            };
        });

        setParticles(newParticles);

        const timer = setTimeout(() => {
            onAnimationEnd();
        }, 3000); // 2.5s max duration + 0.5s max delay

        return () => clearTimeout(timer);

    }, [config, onAnimationEnd]);

    if (!config) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[101] overflow-hidden">
            {particles.map(p => (
                <span
                    key={p.id}
                    className="particle down" // Reuse favorite animation class
                    style={p.style}
                >
                    {p.content}
                </span>
            ))}
        </div>
    );
};

export default ThemeTransitionAnimation;
