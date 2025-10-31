import React, { useState, useEffect } from 'react';
import { ProfileTheme } from '../types';
import { XMarkIcon, ChevronDownIcon, UserIcon } from './Icons';
import { PLACEHOLDER_PROFILE } from '../constants';

interface ProfilePersonalizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentTheme: ProfileTheme | null;
    onSave: (theme: ProfileTheme | null) => void;
}

const fonts = [
  { name: 'Default App Font', value: 'inherit' },
  { name: 'Inter (Sans-serif)', value: "'Inter', sans-serif" },
  { name: 'Playfair Display (Serif)', value: "'Playfair Display', serif" },
  { name: 'Roboto Slab (Serif)', value: "'Roboto Slab', serif" },
  { name: 'Fira Code (Monospace)', value: "'Fira Code', monospace" },
  { name: 'Domine (Serif)', value: "'Domine', serif" },
  { name: 'Poppins (Sans-serif)', value: "'Poppins', sans-serif" },
  { name: 'Merriweather (Serif)', value: "'Merriweather', serif" },
];

const ProfilePersonalizationModal: React.FC<ProfilePersonalizationModalProps> = ({ isOpen, onClose, currentTheme, onSave }) => {
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [fontFamily, setFontFamily] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setBackgroundImage(currentTheme?.backgroundImage || null);
            setFontFamily(currentTheme?.fontFamily || 'inherit');
        }
    }, [isOpen, currentTheme]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File size exceeds 5MB. Please choose a smaller image.');
                return;
            }
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundImage(reader.result as string);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = () => {
        onSave({ backgroundImage, fontFamily });
        onClose();
    };
    
    const handleClear = () => {
        if(window.confirm("Are you sure you want to remove your profile personalization?")) {
            onSave(null);
            onClose();
        }
    };

    const previewStyle: React.CSSProperties = {
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-text-primary">Personalize Profile</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary"><XMarkIcon className="w-5 h-5" /></button>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Background Image</label>
                            <label htmlFor="bg-upload" className={`w-full text-center cursor-pointer p-3 rounded-md font-semibold transition-colors ${isUploading ? 'bg-bg-secondary' : 'bg-accent-gradient text-on-accent hover:opacity-90'}`}>
                                {isUploading ? 'Processing...' : backgroundImage ? 'Change Background' : 'Upload Background'}
                            </label>
                            <input id="bg-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                            {backgroundImage && <button onClick={() => setBackgroundImage(null)} className="text-xs text-red-400 hover:underline mt-2">Remove Image</button>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">Profile Font</label>
                             <div className="relative">
                                <select value={fontFamily || ''} onChange={e => setFontFamily(e.target.value)} className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
                                    {fonts.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-bg-secondary rounded-lg overflow-hidden">
                        <h3 className="text-sm font-semibold p-2 text-center bg-black/20">Live Preview</h3>
                        <div style={previewStyle} className="relative h-full">
                            {backgroundImage && <div className="absolute inset-0 bg-black/50"></div>}
                            <div className="relative p-4" style={{ fontFamily: fontFamily || 'inherit' }}>
                                <header className="flex flex-col items-center space-y-2 mb-4 p-4 bg-black/20 rounded-lg">
                                    <img src={PLACEHOLDER_PROFILE} alt="Preview" className="w-16 h-16 rounded-full object-cover bg-bg-secondary"/>
                                    <div className="text-center">
                                        <h1 className="text-xl font-bold text-white">Your Username</h1>
                                        <p className="text-white/80 text-xs">your@email.com</p>
                                    </div>
                                </header>
                                <div className="bg-black/20 p-4 rounded-lg">
                                    <h3 className="text-lg font-bold text-white mb-2">A Sample List</h3>
                                    <p className="text-sm text-white/80">This is how text will look with the selected font.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-between items-center mt-6 flex-shrink-0">
                     <button onClick={handleClear} className="px-4 py-2 text-sm rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30">Clear Personalization</button>
                    <div className="flex space-x-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded-md bg-accent-gradient text-on-accent">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePersonalizationModal;