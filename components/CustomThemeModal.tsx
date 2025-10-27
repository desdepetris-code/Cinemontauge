import React, { useState } from 'react';
import { Theme } from '../types';
import { XMarkIcon } from './Icons';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: Theme) => void;
}

// --- Helper Functions ---
const manipulateColor = (hex: string, percent: number) => {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    const amount = Math.floor(2.55 * percent);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// FIX: Define a type for pattern objects to allow optional properties like bgColor.
interface Pattern {
    name: string;
    css: (c1: string, c2: string) => string;
    bgSize?: string;
    bgColor?: 'c1' | 'c2' | string;
    bgPosition?: string;
}

// FIX: Changed invalid variable references to string literals 'c1' and 'c2' to be resolved later.
const patterns: Pattern[] = [
    { name: 'Polka Dot', css: (c1: string, c2: string) => `radial-gradient(${c1} 1.5px, ${c2} 1.5px)`, bgSize: '15px 15px' },
    { name: 'Stripes', css: (c1: string, c2: string) => `repeating-linear-gradient(45deg, ${c1}, ${c1} 10px, ${c2} 10px, ${c2} 20px)` },
    { name: 'Checkered', css: (c1: string, c2: string) => `linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(-45deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c1} 75%), linear-gradient(-45deg, transparent 75%, ${c1} 75%)`, bgSize: '20px 20px', bgColor: 'c2' },
    { name: 'Houndstooth', css: (c1: string, c2: string) => `linear-gradient(45deg, ${c2} 25%, transparent 25%, transparent 75%, ${c2} 75%), linear-gradient(45deg, ${c2} 25%, transparent 25%, transparent 75%, ${c2} 75%)`, bgSize: '20px 20px', bgColor: 'c1', bgPosition: '0 0, 10px 10px' },
];

// --- Sub-Components ---

const ColorPicker: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <div className="flex items-center space-x-2 p-2 bg-bg-secondary rounded-md">
            <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 border-none cursor-pointer bg-transparent" style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', 'appearance': 'none'}}/>
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-text-primary focus:outline-none" />
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ${isActive ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}>
        {label}
    </button>
);


// --- Main Modal Component ---

const CustomThemeModal: React.FC<CustomThemeModalProps> = ({ isOpen, onClose, onSave }) => {
    type Tab = 'grad_dark' | 'grad_light' | 'solid_dark' | 'solid_light' | 'pattern';
    const [name, setName] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('grad_dark');
    
    // State for all color configurations
    const [colors, setColors] = useState({
        grad_dark: { bg1: '#1e293b', bg2: '#0f172a', acc1: '#818cf8', acc2: '#4f46e5', text: '#f8fafc' },
        grad_light: { bg1: '#f1f5f9', bg2: '#e2e8f0', acc1: '#4f46e5', acc2: '#312e81', text: '#0f172a' },
        solid_dark: { bg: '#1e293b', acc: '#6366f1', text: '#f8fafc' },
        solid_light: { bg: '#f1f5f9', acc: '#4f46e5', text: '#0f172a' },
        pattern: { p1: '#334155', p2: '#1e293b', overlay: '#1e293b', acc: '#818cf8', text: '#f1f5f9', pattern: patterns[0] }
    });

    if (!isOpen) return null;

    const handleColorChange = (key: string, value: string) => {
        setColors(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], [key]: value } }));
    };
    
    // FIX: Use the Pattern interface for the function parameter type.
    const handlePatternChange = (pattern: Pattern) => {
        setColors(prev => ({...prev, pattern: {...prev.pattern, pattern}}));
    };

    const handleSave = () => {
        if (!name.trim()) return alert('Please enter a name for your theme.');

        const base: 'light' | 'dark' = activeTab.includes('dark') || activeTab === 'pattern' ? 'dark' : 'light';
        const currentColors = colors[activeTab];
        let finalColors: Theme['colors'];

        if (activeTab.startsWith('grad')) {
            const { bg1, bg2, acc1, acc2, text } = currentColors as typeof colors.grad_dark;
            finalColors = {
                bgPrimary: bg1, bgSecondary: bg2, accentPrimary: acc1, accentSecondary: acc2, textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: `linear-gradient(to bottom right, ${bg1}, ${bg2})`,
                accentGradient: `linear-gradient(to right, ${acc1}, ${acc2})`,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(bg2, 0.5)}, ${hexToRgba(bg1, 0.7)})`,
                bgBackdrop: hexToRgba(base === 'dark' ? bg1 : bg2, 0.3),
            };
        } else if (activeTab.startsWith('solid')) {
            const { bg, acc, text } = currentColors as typeof colors.solid_dark;
            const bg2 = manipulateColor(bg, base === 'dark' ? 10 : -10);
            finalColors = {
                bgPrimary: bg, bgSecondary: bg2, accentPrimary: acc, accentSecondary: manipulateColor(acc, 20), textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: bg,
                accentGradient: acc,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(bg2, 0.5)}, ${hexToRgba(bg, 0.7)})`,
                bgBackdrop: hexToRgba(bg, 0.3),
            };
        } else { // Pattern
            const { p1, p2, overlay, acc, text, pattern } = currentColors as typeof colors.pattern;
            const patternCss = pattern.css(p1, p2);
            const overlayRgba = hexToRgba(overlay, 0.85);
            // FIX: Resolve bgColor string literal to actual color value before setting CSS variable.
            const patternBgColor = pattern.bgColor === 'c1' ? p1 : pattern.bgColor === 'c2' ? p2 : pattern.bgColor;
            finalColors = {
                bgPrimary: overlay, bgSecondary: manipulateColor(overlay, 10), accentPrimary: acc, accentSecondary: manipulateColor(acc, 20), textColorPrimary: text,
                textColorSecondary: hexToRgba(text, 0.7),
                bgGradient: `linear-gradient(${overlayRgba}, ${overlayRgba}), ${patternCss}`,
                accentGradient: acc,
                cardGradient: `linear-gradient(to bottom, ${hexToRgba(manipulateColor(overlay, 10), 0.7)}, ${hexToRgba(overlay, 0.85)})`,
                bgBackdrop: hexToRgba(overlay, 0.5),
                patternBgSize: pattern.bgSize || 'auto',
                patternBgColor: patternBgColor || 'transparent',
                patternBgPosition: pattern.bgPosition || '0 0',
            };
        }

        const newTheme: Theme = { id: `custom-${Date.now()}`, name: name.trim(), base, colors: finalColors };
        onSave(newTheme);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-xl p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10"><XMarkIcon className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Create Custom Theme</h2>
                
                <input type="text" placeholder="Theme Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent mb-4"/>
                
                <div className="flex flex-wrap gap-1 p-1 bg-bg-secondary rounded-full mb-6">
                    <TabButton label="Grad Dark" isActive={activeTab === 'grad_dark'} onClick={() => setActiveTab('grad_dark')} />
                    <TabButton label="Grad Light" isActive={activeTab === 'grad_light'} onClick={() => setActiveTab('grad_light')} />
                    <TabButton label="Solid Dark" isActive={activeTab === 'solid_dark'} onClick={() => setActiveTab('solid_dark')} />
                    <TabButton label="Solid Light" isActive={activeTab === 'solid_light'} onClick={() => setActiveTab('solid_light')} />
                    <TabButton label="Pattern" isActive={activeTab === 'pattern'} onClick={() => setActiveTab('pattern')} />
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {activeTab === 'grad_dark' && (<>
                        <ColorPicker label="Background 1" value={colors.grad_dark.bg1} onChange={v => handleColorChange('bg1', v)} />
                        <ColorPicker label="Background 2" value={colors.grad_dark.bg2} onChange={v => handleColorChange('bg2', v)} />
                        <ColorPicker label="Accent / Icon 1" value={colors.grad_dark.acc1} onChange={v => handleColorChange('acc1', v)} />
                        <ColorPicker label="Accent / Icon 2" value={colors.grad_dark.acc2} onChange={v => handleColorChange('acc2', v)} />
                        <ColorPicker label="Text" value={colors.grad_dark.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'grad_light' && (<>
                        <ColorPicker label="Background 1" value={colors.grad_light.bg1} onChange={v => handleColorChange('bg1', v)} />
                        <ColorPicker label="Background 2" value={colors.grad_light.bg2} onChange={v => handleColorChange('bg2', v)} />
                        <ColorPicker label="Accent / Icon 1" value={colors.grad_light.acc1} onChange={v => handleColorChange('acc1', v)} />
                        <ColorPicker label="Accent / Icon 2" value={colors.grad_light.acc2} onChange={v => handleColorChange('acc2', v)} />
                        <ColorPicker label="Text" value={colors.grad_light.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'solid_dark' && (<>
                        <ColorPicker label="Background" value={colors.solid_dark.bg} onChange={v => handleColorChange('bg', v)} />
                        <ColorPicker label="Accent / Icon" value={colors.solid_dark.acc} onChange={v => handleColorChange('acc', v)} />
                        <ColorPicker label="Text" value={colors.solid_dark.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'solid_light' && (<>
                        <ColorPicker label="Background" value={colors.solid_light.bg} onChange={v => handleColorChange('bg', v)} />
                        <ColorPicker label="Accent / Icon" value={colors.solid_light.acc} onChange={v => handleColorChange('acc', v)} />
                        <ColorPicker label="Text" value={colors.solid_light.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                    {activeTab === 'pattern' && (<>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Pattern</label>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {patterns.map(p => (
                                // FIX: Resolve bgColor string literal to actual color value for preview.
                                <div key={p.name} onClick={() => handlePatternChange(p)} className={`h-12 w-full rounded-md cursor-pointer border-2 ${colors.pattern.pattern.name === p.name ? 'border-primary-accent' : 'border-transparent'}`} style={{backgroundImage: p.css(colors.pattern.p1, colors.pattern.p2), backgroundSize: p.bgSize, backgroundColor: p.bgColor === 'c1' ? colors.pattern.p1 : p.bgColor === 'c2' ? colors.pattern.p2 : p.bgColor, backgroundPosition: p.bgPosition}}></div>
                            ))}
                        </div>
                        <ColorPicker label="Pattern Color 1" value={colors.pattern.p1} onChange={v => handleColorChange('p1', v)} />
                        <ColorPicker label="Pattern Color 2" value={colors.pattern.p2} onChange={v => handleColorChange('p2', v)} />
                        <ColorPicker label="Overlay" value={colors.pattern.overlay} onChange={v => handleColorChange('overlay', v)} />
                        <ColorPicker label="Accent / Icon" value={colors.pattern.acc} onChange={v => handleColorChange('acc', v)} />
                        <ColorPicker label="Text" value={colors.pattern.text} onChange={v => handleColorChange('text', v)} />
                    </>)}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90">Save Theme</button>
                </div>
            </div>
        </div>
    );
};

export default CustomThemeModal;