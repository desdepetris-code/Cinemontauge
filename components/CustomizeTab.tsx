import React, { useState, useMemo } from 'react';
import { PhotoIcon, PlusIcon, InformationCircleIcon, CheckCircleIcon, XMarkIcon, TrashIcon } from './Icons';
import { CustomImagePaths, TmdbImage } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';

interface CustomizeTabProps {
  posterUrl: string;
  backdropUrl: string;
  onOpenPosterSelector: () => void;
  onOpenBackdropSelector: () => void;
  showId: number;
  customImagePaths: CustomImagePaths;
  details?: { 
    poster_path?: string | null; 
    backdrop_path?: string | null;
    images?: {
        posters: TmdbImage[];
        backdrops: TmdbImage[];
    }
  };
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  onRemoveCustomImage?: (showId: number, imagePath: string) => void;
}

const CustomizeTab: React.FC<CustomizeTabProps> = ({ 
    posterUrl, 
    backdropUrl, 
    onOpenPosterSelector, 
    onOpenBackdropSelector, 
    showId, 
    customImagePaths, 
    details,
    onSetCustomImage,
    onRemoveCustomImage
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const hasCustomPoster = !!customImagePaths[showId]?.poster_path;
  const hasCustomBackdrop = !!customImagePaths[showId]?.backdrop_path;
  const userGallery = customImagePaths[showId]?.gallery || [];

  const assetLibrary = useMemo(() => {
      const items: { url: string; type: 'official' | 'custom'; category: 'poster' | 'backdrop' }[] = [];
      userGallery.forEach(url => items.push({ url, type: 'custom', category: 'poster' })); 
      details?.images?.backdrops?.forEach(img => items.push({ url: img.file_path, type: 'official', category: 'backdrop' }));
      details?.images?.posters?.forEach(img => items.push({ url: img.file_path, type: 'official', category: 'poster' }));
      return Array.from(new Map(items.map(item => [item.url, item])).values());
  }, [userGallery, details?.images]);

  const handleApplyAsset = (type: 'poster' | 'backdrop') => {
      if (selectedAsset) {
          onSetCustomImage(showId, type, selectedAsset);
          setSelectedAsset(null);
      }
  };

  const getFullUrl = (path: string) => {
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      return `${TMDB_IMAGE_BASE_URL}original${path}`;
  };

  return (
    <div className="animate-fade-in space-y-12">
        {selectedAsset && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedAsset(null)}>
                <div className="bg-bg-primary max-w-md w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="aspect-video relative">
                        <img src={getFullUrl(selectedAsset)} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setSelectedAsset(null)} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-all"><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="p-8 text-center">
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-2">Reassign Asset</h3>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60 mb-6">Select how to apply this image to your library</p>
                        <div className="grid grid-cols-1 gap-3">
                            <button onClick={() => handleApplyAsset('poster')} className="w-full py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-[1.02] transition-transform">Set as Primary Poster</button>
                            <button onClick={() => handleApplyAsset('backdrop')} className="w-full py-4 rounded-2xl bg-bg-secondary border border-white/10 text-text-primary font-black uppercase tracking-[0.2em] text-[10px] hover:bg-bg-secondary/70 transition-all">Set as Primary Backdrop</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="p-5 bg-primary-accent/10 rounded-2xl border border-primary-accent/20 flex items-center gap-4">
            <InformationCircleIcon className="w-6 h-6 text-primary-accent flex-shrink-0" />
            <p className="text-[11px] font-black uppercase tracking-widest text-primary-accent leading-relaxed">
                Security Note: Images you upload are stored strictly in your browser and will only appear on your account.
            </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Chameleon Canvas</h2>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Personalize your library registry</p>
            </div>
            <button onClick={onOpenPosterSelector} className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-primary-accent text-on-accent font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95">
                <PlusIcon className="w-5 h-5" /> Add New Image
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary px-2">Primary Poster</h3>
                <div onClick={onOpenPosterSelector} className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-[2/3] bg-bg-secondary/40 cursor-pointer group">
                    <img src={posterUrl} alt="Current poster" className="w-full h-full object-cover transition-transform duration-1000" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><PhotoIcon className="w-12 h-12 text-white" /></div>
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomPoster ? 'Custom Selection' : 'Registry Default'}</div>
                </div>
            </div>
            <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary px-2">Primary Backdrop</h3>
                <div onClick={onOpenBackdropSelector} className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-video bg-bg-secondary/40 cursor-pointer group">
                    <img src={backdropUrl} alt="Current backdrop" className="w-full h-full object-cover transition-transform duration-1000" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><PhotoIcon className="w-12 h-12 text-white" /></div>
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomBackdrop ? 'Custom Selection' : 'Registry Default'}</div>
                </div>
            </div>
        </div>

        <section className="pt-8 border-t border-white/5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-8 px-2">Cinematic Asset Library</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <button onClick={onOpenPosterSelector} className="aspect-[2/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-text-secondary/20 hover:border-primary-accent/40 hover:bg-primary-accent/5 transition-all group shadow-inner">
                    <PlusIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add New Image</span>
                </button>
                {assetLibrary.map((item, i) => (
                    <div key={`${item.url}-${i}`} onClick={() => setSelectedAsset(item.url)} className={`relative rounded-2xl overflow-hidden shadow-xl border border-white/5 group/asset cursor-pointer bg-bg-secondary/40 transition-all hover:scale-105 ${item.category === 'backdrop' ? 'aspect-video col-span-2' : 'aspect-[2/3]'}`}>
                        <img src={getFullUrl(item.url)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/asset:scale-110" loading="lazy" />
                        {item.type === 'custom' && (
                            <button onClick={(e) => { e.stopPropagation(); if (window.confirm("Remove this image?")) onRemoveCustomImage?.(showId, item.url); }} className="absolute top-2 right-2 p-1.5 bg-red-600/80 backdrop-blur-md rounded-lg text-white shadow-lg hover:bg-red-500 transition-all z-20"><TrashIcon className="w-4 h-4" /></button>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/asset:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <div className="p-3 bg-white/10 rounded-full backdrop-blur-md"><PlusIcon className="w-5 h-5 text-white" /></div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/80">Reassign</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    </div>
  );
};

export default CustomizeTab;