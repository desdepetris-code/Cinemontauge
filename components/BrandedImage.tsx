import React from 'react';

interface BrandedImageProps {
    title: string;
    status?: string | null;
    children: React.ReactNode;
}

const BrandedImage: React.FC<BrandedImageProps> = ({ title, status, children }) => {
    const textToShow = status || title;
    let colorClass = 'text-white'; // default for title-only
    let bgColor = 'bg-black/60';

    if (status) {
        if (status === 'Ended' || status === 'Canceled') {
            bgColor = 'bg-rose-700/90';
            colorClass = 'text-rose-100';
        } else if (status === 'Ongoing/In Season') {
            bgColor = 'bg-emerald-600/90';
            colorClass = 'text-emerald-100';
        } else if (status === 'Ongoing/Off Season') {
            bgColor = 'bg-sky-700/90';
            colorClass = 'text-sky-100';
        }
    }
    
    return (
        <>
            {children}
            <div className={`absolute top-0 left-0 bottom-0 w-6 ${bgColor} flex items-center justify-center backdrop-blur-sm pointer-events-none`}>
                <span 
                    className={`${colorClass} font-bold text-[10px] uppercase tracking-wider [writing-mode:vertical-rl] [text-orientation:mixed] transform rotate-180 whitespace-nowrap overflow-hidden text-ellipsis px-1`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.7)' }}
                >
                    {textToShow}
                </span>
            </div>
        </>
    );
};

export default BrandedImage;