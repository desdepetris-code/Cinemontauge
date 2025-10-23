import React from 'react';
import { CloudArrowUpIcon } from '../components/Icons';
import { TraktIcon, TvdbIcon, TmdbIcon, ImdbIcon, TvTimeIcon, ShowlyIcon } from '../components/ServiceIcons';

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-text-secondary mt-1">{subtitle}</p>}
    </div>
);

const ServiceCard: React.FC<{ name: string; description: string; icon: React.ReactNode }> = ({ name, description, icon }) => (
    <div className="bg-bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-10 h-10">{icon}</div>
            <div>
                <h3 className="font-semibold text-text-primary">{name}</h3>
                <p className="text-sm text-text-secondary">{description}</p>
            </div>
        </div>
        <button
            onClick={() => alert(`${name} connection coming soon!`)}
            className="px-4 py-1.5 text-sm rounded-md font-semibold bg-bg-secondary text-text-primary hover:brightness-125 transition-all"
        >
            Connect
        </button>
    </div>
);

const ImportsScreen: React.FC = () => {

  const handleCsvUpload = () => {
    // This would trigger a file input click event
    alert('CSV import coming soon!');
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
        <SectionHeader title="Connect a Service" />
        <div className="space-y-4">
            <ServiceCard name="Trakt" description="Import watch history, lists, and ratings." icon={<TraktIcon />} />
            <ServiceCard name="The Movie Database (TMDB)" description="Import your rated movies and shows." icon={<TmdbIcon />} />
            <ServiceCard name="The TVDB" description="Import your favorites and ratings." icon={<TvdbIcon />} />
            <ServiceCard name="TV Time" description="Import your tracked shows and movies." icon={<TvTimeIcon />} />
            <ServiceCard name="IMDb" description="Import your public ratings and lists." icon={<ImdbIcon />} />
            <ServiceCard name="Showly" description="Import your full watch history." icon={<ShowlyIcon />} />
        </div>
      </div>
      
       <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
        <SectionHeader 
            title="Upload a CSV File"
            subtitle="Alternatively, upload CSV files exported from Trakt, TV Time, TMDB, TVDB, or IMDb."
        />
        <button 
            onClick={handleCsvUpload}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-bg-secondary hover:brightness-125 transition-all text-text-primary font-semibold"
        >
            <CloudArrowUpIcon className="w-6 h-6" />
            <span>Choose a file...</span>
        </button>
      </div>

       <div className="bg-card-gradient rounded-lg shadow-md p-6 mb-8">
        <SectionHeader title="Import Status" />
        <div className="text-text-secondary text-center p-4 border-2 border-dashed border-bg-secondary rounded-lg">
            <p>No services connected yet.</p>
            <p className="text-sm">Your import history will appear here.</p>
        </div>
      </div>

      <div className="text-center text-xs text-text-secondary/70">
          <p className="font-semibold">Privacy &amp; Security Note</p>
          <p>SceneIt never stores your login credentials for other services. Only secure API tokens are used to fetch your data.</p>
      </div>
    </div>
  );
};

export default ImportsScreen;