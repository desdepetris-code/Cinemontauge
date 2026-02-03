
import React from 'react';

interface BrandedImageProps {
    title: string;
    status?: string | null;
    children: React.ReactNode;
}

const BrandedImage: React.FC<BrandedImageProps> = ({ title, status, children }) => {
    const textToShow = status ? status.replace('Status: ', '').replace('Ongoing: ', '') : '';
    let colorClass = 'text-white';
    let bgColor = 'bg-black/70';

    if (status) {
        if (status.includes('Ended')) {
            bgColor = 'bg-black/90';
            colorClass = 'text-gray-300';
        } else if (status.includes('Canceled')) {
            bgColor = 'bg-blue-900/90';
            colorClass = 'text-blue-200';
        } else if (status.includes('in season')) {
            bgColor = 'bg-red-900/90';
            colorClass = 'text-red-100';
        } else if (status.includes('off season') || status.includes('Undetermined') || status.includes('Hiatus')) {
            bgColor = 'bg-purple-900/90';
            colorClass = 'text-purple-200';
        } else if (status.includes('Upcoming')) {
            bgColor = 'bg-teal-900/90';
            colorClass = 'text-teal-100';
        } else if (status.includes('All Caught Up')) {
            bgColor = 'bg-emerald-900/90';
            colorClass = 'text-emerald-100';
        }
    }

    // Wrap children in a relative container to maintain overlay context for parents
    return (
        <div className="flex flex-col h-full w-full">
            <div className="relative flex-grow">
                {children}
            </div>
            {status && (
                <div className={`flex-shrink-0 h-8 ${bgColor} flex items-center justify-center backdrop-blur-md z-10 border-t border-white/10`}>
                    <span 
                        className={`${colorClass} font-black text-[11px] uppercase tracking-[0.15em] px-2 truncate leading-none text-center`}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                        {textToShow}
                    </span>
                </div>
            )}
        </div>
    );
};

export default BrandedImage;
