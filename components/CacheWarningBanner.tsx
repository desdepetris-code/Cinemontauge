import React from 'react';
import { InformationCircleIcon, TrashIcon } from './Icons';

interface CacheWarningBannerProps {
  onClearCache: () => void;
  onDismiss: () => void;
}

const CacheWarningBanner: React.FC<CacheWarningBannerProps> = ({ onClearCache, onDismiss }) => {
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg p-4 animate-slide-in-up">
      <div className="bg-yellow-500/20 border border-yellow-400/50 rounded-lg shadow-lg p-4 flex items-start space-x-3 backdrop-blur-sm">
        <InformationCircleIcon className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <h3 className="font-bold text-yellow-200">Storage Almost Full</h3>
          <p className="text-sm text-yellow-300/80 mt-1">
            Your browser's local storage is nearly full. This may cause issues with caching new data. Clearing the API cache can help. Your personal data will not be affected.
          </p>
          <div className="mt-3 flex items-center space-x-4">
            <button
              onClick={onClearCache}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-md bg-yellow-400 text-yellow-900 hover:bg-yellow-300 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear API Cache</span>
            </button>
            <button onClick={onDismiss} className="text-xs font-semibold text-yellow-300/80 hover:underline">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CacheWarningBanner;
