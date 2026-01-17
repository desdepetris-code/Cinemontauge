import React from 'react';
import { StarIcon } from './Icons';

interface UserRatingStampProps {
    rating: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const UserRatingStamp: React.FC<UserRatingStampProps> = ({ rating, size = 'sm', className = '' }) => {
    if (!rating || rating <= 0) return null;

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-[9px] gap-1',
        md: 'px-2 py-1 text-[11px] gap-1.5',
        lg: 'px-3 py-1.5 text-[13px] gap-2',
    };

    const iconSizes = {
        sm: 'w-2.5 h-2.5',
        md: 'w-3.5 h-3.5',
        lg: 'w-4.5 h-4.5',
    };

    return (
        <div className={`flex items-center bg-yellow-500 text-black font-black uppercase rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] border border-yellow-300/50 z-20 ${sizeClasses[size]} ${className}`}>
            <StarIcon filled className={iconSizes[size]} />
            <span>{rating}</span>
        </div>
    );
};

export default UserRatingStamp;