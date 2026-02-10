import React, { useState, useEffect, useRef } from 'react';
import { TmdbImage } from '../types';
import { TMDB_IMAGE_BASE_URL } from '../constants';
import { SparklesIcon, PlusIcon, CloudArrowUpIcon, XMarkIcon, ArrowPathIcon } from './Icons';

interface ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  posters: TmdbImage[];
  backdrops: TmdbImage[];
  onSelect: (type: 'poster' | 'backdrop', path: string | File) => void;
  initialTab?: 'posters' | 'backdrops';
}

/**
 * Reshapes an image to a target aspect ratio using a canvas.
 * Center-crops the image to fit.
 */
const reshapeImage = (file: File, targetRatio: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context not available'));

            let sourceWidth = img.width;
            let sourceHeight = img.height;
            const currentRatio = sourceWidth / sourceHeight;

            let drawWidth = sourceWidth;
            let drawHeight = sourceHeight;
            let offsetX = 0;
            let offsetY = 0;

            if (currentRatio > targetRatio) {
                // Image is wider than target
                drawWidth = sourceHeight * targetRatio;
                offsetX = (sourceWidth - drawWidth) / 2;
            } else {
                // Image is taller than target
                drawHeight = sourceWidth / targetRatio;
                offsetY = (sourceHeight - drawHeight) / 2;
            }

            // Set high-res output dimensions
            const outputWidth = targetRatio > 1 ? 1920 : 1000;
            const outputHeight = outputWidth / targetRatio;
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, outputWidth, outputHeight);

            canvas.toBlob((blob) => {
                if (blob) {
                    const reshapedFile = new File([blob], file.name, { type: 'image/jpeg' });
                    resolve(reshapedFile);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/jpeg', 0.9);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

const ImageSelectorModal: React.FC<ImageSelectorModalProps> = ({ isOpen, onClose, posters, backdrops, onSelect, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'posters' | 'backdrops'>(initialTab || 'posters');
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab || 'posters');
        setCustomUrl('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSelect = (type: 'poster' | 'backdrop', path: string | File) => {
    onSelect(type, path);
    onClose();
  };
  
  const handleCustomUrlSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!customUrl.trim()) return;
      handleSelect(activeTab === 'posters' ? 'poster' : 'backdrop', customUrl.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file.');
          return;
      }

      setIsUploading(true);
      try {
          // Target Ratio: Poster (2:3 = 0.66), Backdrop (16:9 = 1.77)
          const ratio = activeTab === 'posters' ? 2/3 : 16/9;
          const reshapedFile = await reshapeImage(file, ratio);
          handleSelect(activeTab === 'posters' ? 'poster' : 'backdrop', reshapedFile);
      } catch (err) {
          console.error("Image reshaping failed:", err);
          alert("Could not process image dimensions.");
      } finally {
          setIsUploading(false);
      }
  };

  const imagesToShow = activeTab === 'posters' ? posters : backdrops;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[150] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-8 animate-fade-in border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8 flex-shrink-0">
            <div>
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Chameleon Canvas</h2>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Personalize your cinematic experience</p>
            </div>
            <div className="flex p-1 bg-bg-secondary rounded-2xl border border-white/5">
                <button
                    onClick={() => setActiveTab('posters')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === 'posters' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Posters ({posters.length})
                </button>
                <button
                    onClick={() => setActiveTab('backdrops')}
                    className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                    activeTab === 'backdrops' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                    Backdrops ({backdrops.length})
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 flex-shrink-0">
            <form onSubmit={handleCustomUrlSubmit} className="flex gap-3 p-4 bg-bg-secondary/30 rounded-2xl border border-white/5 shadow-inner">
                <div className="flex-grow relative">
                    <input 
                        type="text" 
                        placeholder="Paste image URL..." 
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-bg-primary text-sm font-bold rounded-xl border border-white/10 focus:border-primary-accent focus:ring-1 focus:ring-primary-accent focus:outline-none transition-all"
                    />
                    <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-accent" />
                </div>
                <button 
                    type="submit"
                    disabled={!customUrl.trim()}
                    className="px-6 py-3 bg-accent-gradient text-on-accent font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-transform disabled:opacity-30 shadow-lg"
                >
                    Add URL
                </button>
            </form>

            <div className="flex gap-3 p-4 bg-bg-secondary/30 rounded-2xl border border-white/5 shadow-inner">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-grow flex items-center justify-center gap-3 py-3 bg-bg-primary text-text-primary font-black uppercase text-[10px] tracking-widest rounded-xl border border-white/10 hover:border-primary-accent transition-all shadow-md"
                >
                    {isUploading ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin text-primary-accent" />
                    ) : (
                        <CloudArrowUpIcon className="w-5 h-5 text-primary-accent" />
                    )}
                    <span>{isUploading ? 'Reshaping & Syncing...' : 'Upload & Reshape Image'}</span>
                </button>
                <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                />
            </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
            {imagesToShow.length > 0 ? (
                <div className={`grid gap-4 ${activeTab === 'posters' ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {imagesToShow.map(image => (
                        <div key={image.file_path} className="cursor-pointer group relative rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-bg-secondary/40" onClick={() => handleSelect(activeTab === 'posters' ? 'poster' : 'backdrop', image.file_path)}>
                            <img 
                                src={`${TMDB_IMAGE_BASE_URL}${activeTab === 'posters' ? 'w342' : 'w500'}${image.file_path}`}
                                alt=""
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300">
                                <PlusIcon className="w-10 h-10 text-white mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Apply This</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                    <SparklesIcon className="w-16 h-16 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest">No official {activeTab} available.</p>
                    <p className="text-xs font-bold uppercase tracking-widest mt-1">Try adding a new image above.</p>
                </div>
            )}
        </div>
        
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5 flex-shrink-0">
            <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-40 max-w-sm">Images are automatically center-cropped to the correct aspect ratio ({activeTab === 'posters' ? '2:3' : '16:9'}) and stored securely in the Cloud Registry.</p>
            <button
                onClick={onClose}
                className="px-10 py-3 rounded-full text-text-secondary font-black uppercase tracking-widest text-xs bg-bg-secondary hover:text-text-primary hover:bg-bg-secondary/80 transition-all border border-white/5"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageSelectorModal;