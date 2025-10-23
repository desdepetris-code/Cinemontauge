

import React, { useState, useEffect } from 'react';
import { discoverMedia } from '../services/tmdbService';
import { TmdbMedia } from '../types';
import MediaCard from '../components/MediaCard';
import { ChevronDownIcon } from '../components/Icons';

interface RecommendationsProps {
  onAdd: (item: TmdbMedia) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  genres: Record<number, string>;
}

const sortOptions = [
  { value: 'popularity.desc', label: 'Popularity (Most)' },
  { value: 'popularity.asc', label: 'Popularity (Least)' },
  { value: 'release_date.desc', label: 'Release Date (Newest)' },
  { value: 'release_date.asc', label: 'Release Date (Oldest)' },
  { value: 'vote_average.desc', label: 'Rating (Highest)' },
  { value: 'vote_average.asc', label: 'Rating (Lowest)' },
  { value: 'original_title.asc', label: 'Title (A-Z)' },
  { value: 'original_title.desc', label: 'Title (Z-A)' },
];

const FilterSelect: React.FC<{
    label: string;
    value: string | number | undefined;
    onChange: (value: any) => void;
    options: {value: string | number; label: string}[];
  }> = ({ label, value, onChange, options }) => (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
      >
        <option value="">{label}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
    </div>
);

const Recommendations: React.FC<RecommendationsProps> = ({ onAdd, onSelectShow, genres }) => {
  const [mediaType, setMediaType] = useState<'tv' | 'movie'>('tv');
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiscover = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          genre: selectedGenre,
          year: selectedYear,
          sortBy: sortBy,
        };
        const discoveredMedia = await discoverMedia(mediaType, filters);
        setResults(discoveredMedia);
      } catch (e) {
        console.error(e);
        setError("Could not load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDiscover();
  }, [mediaType, selectedGenre, selectedYear, sortBy]);
  
  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);
  const sortedGenres = Object.entries(genres).sort(([, a], [, b]) => String(a).localeCompare(String(b)));

  return (
    <div className="animate-fade-in px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-2 text-text-secondary">Find new shows and movies based on your preferences.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="flex p-1 bg-bg-secondary rounded-md">
            <button
                onClick={() => setMediaType('tv')}
                className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${
                mediaType === 'tv' ? 'bg-accent-gradient text-white' : 'text-text-secondary'
                }`}
            >
                TV Shows
            </button>
            <button
                onClick={() => setMediaType('movie')}
                className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${
                mediaType === 'movie' ? 'bg-accent-gradient text-white' : 'text-text-secondary'
                }`}
            >
                Movies
            </button>
        </div>
        <FilterSelect 
          label="All Genres"
          value={selectedGenre}
          onChange={(val) => setSelectedGenre(val ? Number(val) : undefined)}
          options={sortedGenres.map(([id, name]) => ({ value: Number(id), label: name }))}
        />
         <FilterSelect 
          label="All Years"
          value={selectedYear}
          onChange={(val) => setSelectedYear(val ? Number(val) : undefined)}
          options={years.map(y => ({ value: y, label: y.toString() }))}
        />
        <FilterSelect
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={sortOptions}
        />
      </div>

      {loading && <div className="text-center p-8">Loading...</div>}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}
      
      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map(item => (
            <MediaCard key={item.id} item={item} onSelect={onSelectShow} onAdd={onAdd} />
          ))}
        </div>
      )}

      {!loading && !error && results.length === 0 && (
         <div className="text-center py-20 px-6">
          <h2 className="text-2xl font-bold text-text-primary">No Results Found</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            Try adjusting your filters to find different shows or movies.
          </p>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
