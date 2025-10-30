import React, { useMemo } from 'react';
import { Theme } from '../types';

type ParticleEffect = Theme['colors']['particleEffect'];

interface BackgroundParticleEffectsProps {
  effect: ParticleEffect | undefined;
}

const particleConfig = {
    snow: { content: '❄️', count: 30, minSize: 10, maxSize: 20 },
    hearts: { content: '❤️', count: 20, minSize: 12, maxSize: 24 },
    leaves: { content: ['🍂', '🍁', '🍃'], count: 25, minSize: 15, maxSize: 25 },
    confetti: { content: ['🎉', '🎊', '✨'], count: 40, minSize: 10, maxSize: 20 },
    fireworks: { content: ['🎆', '🎇'], count: 15, minSize: 20, maxSize: 40 },
    sparkles: { content: '✨', count: 35, minSize: 8, maxSize: 16 },
    bats: { content: '🦇', count: 20, minSize: 15, maxSize: 25 },
    flowers: { content: ['🌸', '🌼', '🌷'], count: 25, minSize: 15, maxSize: 25 },
    pumpkins: { content: '🎃', count: 15, minSize: 20, maxSize: 30 },
};

const BackgroundParticleEffects: React.FC<BackgroundParticleEffectsProps> = ({ effect }) => {
    const particles = useMemo(() => {
        if (!effect) return [];
        const config = particleConfig[effect];
        if (!config) return [];

        return Array.from({ length: config.count }).map((_, i) => {
            const content = Array.isArray(config.content)
                ? config.content[i % config.content.length]
                : config.content;
            
            const animationName = ['leaves', 'bats'].includes(effect) ? 'sway-and-fall' : 'fall';
            const duration = Math.random() * 8 + 8; // 8-16 seconds
            const delay = Math.random() * -16; // Start at different times
            const left = Math.random() * 100;
            const size = Math.random() * (config.maxSize - config.minSize) + config.minSize;

            return {
                id: i,
                content,
                style: {
                    left: `${left}vw`,
                    fontSize: `${size}px`,
                    animation: `${animationName} ${duration}s linear ${delay}s infinite`,
                    '--sway-amount': `${(Math.random() - 0.5) * 10}vw`
                } as React.CSSProperties,
            };
        });
    }, [effect]);

    if (!effect) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map(p => (
                <span key={p.id} className="particle-bg" style={p.style}>
                    {p.content}
                </span>
            ))}
        </div>
    );
};

export default BackgroundParticleEffects;
