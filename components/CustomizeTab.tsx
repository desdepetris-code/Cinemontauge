import React, { useState, useMemo } from 'react';
import { PhotoIcon, PlusIcon, InformationCircleIcon, CheckCircleIcon, XMarkIcon, TrashIcon, ArrowPathIcon } from './Icons';
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
  } | null;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string | File) => void;
  onRemoveCustomImage?: (showId: number, imagePath: string) => void;
  onResetCustomImage: (mediaId: number, type: 'poster' | 'backdrop') => void;
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
    onRemoveCustomImage,
    onResetCustomImage
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const hasCustomPoster = !!customImagePaths[showId]?.poster_path;
  const hasCustomBackdrop = !!customImagePaths[showId]?.backdrop_path;
  const userGallery = customImagePaths[showId]?.gallery || [];

  const assetLibrary = useMemo(() => {
      const items: { url: string; type: 'official' | 'custom'; category: 'poster' | 'backdrop' }[] = [];
      
      // 1. Add User Custom Gallery Items
      if (Array.isArray(userGallery)) {
        userGallery.forEach(url => items.push({ url, type: 'custom', category: 'poster' })); 
      }
      
      // 2. Add Official Backdrops
      if (details?.images?.backdrops) {
          details.images.backdrops.forEach(img => {
              if (img.file_path) items.push({ url: img.file_path, type: 'official', category: 'backdrop' });
          });
      }
      
      // 3. Add Official Posters
      if (details?.images?.posters) {
          details.images.posters.forEach(img => {
              if (img.file_path) items.push({ url: img.file_path, type: 'official', category: 'poster' });
          });
      }
      
      // Deduplicate by URL using a Map (Standard Pattern) to ensure flat objects are returned
      return Array.from(new Map(items.map(item => [item.url, item])).values());
  }, [userGallery, details]);

  const handleApplyAsset = (type: 'poster' | 'backdrop') => {
      if (selectedAsset) {
          onSetCustomImage(showId, type, selectedAsset);
          setSelectedAsset(null);
      }
  };

  const getFullUrl = (path: string) => {
      if (!path) return '';
      if (path.startsWith('http') || path.startsWith('data:')) return path;
      return `${TMDB_IMAGE_BASE_URL}original${path}`;
  };

  const handleRemove = (e: React.MouseEvent, url: string) => {
      e.stopPropagation();
      if (window.confirm("ARE YOU SURE?\n\nThis will permanently delete this asset from the CineMontauge Registry. This action cannot be undone.")) {
          onRemoveCustomImage?.(showId, url);
          if (selectedAsset === url) setSelectedAsset(null);
      }
  };

  return (
    <div className="animate-fade-in space-y-12 pb-10">
        {selectedAsset && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-fade-in" onClick={() => setSelectedAsset(null)}>
                <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-white/10 flex flex-col" onClick={e => e.stopPropagation()}>
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
                Registry Note: Assets you upload are stored securely in the cloud linked to your identity. You can manage them anytime.
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
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary px-2 text-center md:text-left">Primary Poster</h3>
                <div onClick={onOpenPosterSelector} className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-[2/3] bg-bg-secondary/40 cursor-pointer group">
                    <img src={posterUrl} alt="Current poster" className="w-full h-full object-cover transition-transform duration-1000" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><PhotoIcon className="w-12 h-12 text-white" /></div>
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomPoster ? 'Custom Selection' : 'Registry Default'}</div>
                </div>
                {hasCustomPoster && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onResetCustomImage(showId, 'poster'); }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10 transition-all shadow-xl active:scale-95 group"
                    >
                        <ArrowPathIcon className="w-4 h-4 text-primary-accent group-hover:rotate-180 transition-transform duration-500" />
                        <span>Reset Poster</span>
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary px-2 text-center md:text-left">Primary Backdrop</h3>
                <div onClick={onOpenBackdropSelector} className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 aspect-video bg-bg-secondary/40 cursor-pointer group">
                    <img src={backdropUrl} alt="Current backdrop" className="w-full h-full object-cover transition-transform duration-1000" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"><PhotoIcon className="w-12 h-12 text-white" /></div>
                    <div className="absolute top-6 left-6 z-10 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/80 shadow-lg">{hasCustomBackdrop ? 'Custom Selection' : 'Registry Default'}</div>
                </div>
                {hasCustomBackdrop && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onResetCustomImage(showId, 'backdrop'); }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10 transition-all shadow-xl active:scale-95 group"
                    >
                        <ArrowPathIcon className="w-4 h-4 text-primary-accent group-hover:rotate-180 transition-transform duration-500" />
                        <span>Reset Backdrop</span>
                    </button>
                )}
            </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-white/5">
            <div>
                <h3 className="text-xl font-black text-text-primary uppercase tracking-widest">Asset Registry</h3>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-60">Manage all available visual identifiers for this title</p>
            </div>

            {assetLibrary.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {assetLibrary.map((asset) => (
                        <div 
                            key={asset.url} 
                            onClick={() => setSelectedAsset(asset.url)}
                            className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-bg-secondary/40 cursor-pointer shadow-lg hover:border-primary-accent/40 transition-all"
                        >
                            <img src={getFullUrl(asset.url)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlusIcon className="w-8 h-8 text-white" />
                            </div>
                            
                            <div className="absolute top-3 left-3">
                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 text-white ${asset.type === 'custom' ? 'bg-primary-accent/40' : 'bg-black/40'}`}>
                                    {asset.type}
                                </span>
                            </div>

                            {asset.type === 'custom' && (
                                <button 
                                    onClick={(e) => handleRemove(e, asset.url)}
                                    className="absolute top-3 right-3 p-1.5 bg-red-600/80 text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center bg-bg-secondary/10 rounded-[3rem] border border-dashed border-white/10 opacity-30">
                    <PhotoIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No additional assets in registry</p>
                </div>
            )}
        </div>
    </div>
  );
};

/* // FIX: Added missing default export to resolve "no default export" errors in ShowDetail components. */
export default CustomizeTab;