import React, { useState, useEffect } from 'react';
import { animationService } from '../services/animationService';
import { getImageUrl } from '../utils/imageUtils';

interface Animation {
    id: number;
    type: 'flyToNav';
    payload: { posterPath: string | null };
}

const FlyToNavAnimation: React.FC<{ posterPath: string | null; onEnd: () => void }> = ({ posterPath, onEnd }) => {
    useEffect(() => {
        const timer = setTimeout(onEnd, 1200); // Match CSS animation duration
        return () => clearTimeout(timer);
    }, [onEnd]);

    return (
        <img
            src={getImageUrl(posterPath, 'w154')}
            alt=""
            className="fly-poster"
        />
    );
};

const AnimationContainer: React.FC = () => {
    const [animations, setAnimations] = useState<Animation[]>([]);

    useEffect(() => {
        const unsubscribe = animationService.subscribe((type, payload) => {
            const newAnimation: Animation = {
                id: Date.now() + Math.random(),
                type,
                payload,
            };
            setAnimations(prev => [...prev, newAnimation]);
        });
        return unsubscribe;
    }, []);

    const removeAnimation = (id: number) => {
        setAnimations(prev => prev.filter(anim => anim.id !== id));
    };

    return (
        <>
            {animations.map(anim => {
                if (anim.type === 'flyToNav') {
                    return (
                        <FlyToNavAnimation
                            key={anim.id}
                            posterPath={anim.payload.posterPath}
                            onEnd={() => removeAnimation(anim.id)}
                        />
                    );
                }
                return null;
            })}
        </>
    );
};

export default AnimationContainer;