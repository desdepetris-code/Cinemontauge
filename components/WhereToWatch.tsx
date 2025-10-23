import React from 'react';
import { WatchProviderResponse } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface WhereToWatchProps {
  providers: WatchProviderResponse | null;
}

const ProviderGroup: React.FC<{ title: string; providers?: { provider_name: string; logo_path: string }[] }> = ({ title, providers }) => {
  if (!providers || providers.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="font-semibold text-text-secondary mb-3">{title}</h3>
      <div className="flex flex-wrap gap-4">
        {providers.map(p => (
          <div key={p.provider_name} className="flex items-center space-x-2 bg-bg-secondary p-2 rounded-lg">
            <img src={getImageUrl(p.logo_path, 'w92')} alt={p.provider_name} className="w-8 h-8 rounded-md object-contain" />
            <span className="text-sm text-text-primary">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const WhereToWatch: React.FC<WhereToWatchProps> = ({ providers }) => {
  const usProviders = providers?.results?.US;

  if (!usProviders || (!usProviders.flatrate && !usProviders.rent && !usProviders.buy)) {
    return <p className="text-text-secondary">Watch provider information is not available for this region.</p>;
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-text-primary mb-4">Where to Watch (US)</h2>
      <ProviderGroup title="Stream" providers={usProviders.flatrate} />
      <ProviderGroup title="Rent" providers={usProviders.rent} />
      <ProviderGroup title="Buy" providers={usProviders.buy} />
       <p className="text-xs text-text-secondary/70 mt-4">
        Provider availability is subject to change. Data provided by JustWatch via TMDB.
      </p>
    </div>
  );
};

export default WhereToWatch;