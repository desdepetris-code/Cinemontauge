import React from 'react';
import { SparklesIcon } from './Icons';

interface RecommendationHintProps {
    reason: string;
}

const RecommendationHint: React.FC<RecommendationHintProps> = ({ reason }) => {
    return (
        <div className="flex items-center space-x-1 text-[10px] font-semibold text-yellow-300 mb-1">
            <SparklesIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{reason}</span>
        </div>
    );
};

export default RecommendationHint;
