import { Theme } from './types';

// --- THEME REGISTRY (EXACTLY 5 PERMANENT THEMES) ---

const midnightBlue: Theme = {
  id: 'noir-electric',
  name: 'Midnight Blue',
  description: 'Cinematic obsidian with anamorphic lens-flare accents.',
  base: 'dark',
  colors: {
    // Deepest Obsidian to a very dark Navy for depth
    bgGradient: 'linear-gradient(135deg, #020617 0%, #000000 100%)',
    // Electric Cobalt to Cyan - The "Lens Flare" look
    accentGradient: 'linear-gradient(to right, #2e5cfc, #0ea5e9)',
    cardGradient: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(0, 0, 0, 0.9))',
    // Indigo-tinted white for "Starlight" text
    textColorPrimary: '#e0e7ff', 
    textColorSecondary: 'rgba(148, 163, 184, 0.8)',
    accentPrimary: '#3b82f6',
    accentSecondary: '#0ea5e9',
    bgPrimary: '#020617',
    bgSecondary: 'rgba(30, 58, 138, 0.15)',
    bgBackdrop: 'rgba(0, 0, 0, 0.85)',
    error: '#f87171',
    success: '#34d399',
    onAccent: '#ffffff',
    patternOpacity: '0.04'
  }
};

const roseLight: Theme = {
  id: 'vibrant-rose',
  name: 'Rose Light',
  description: 'Vibrant, expressive, and personality-driven.',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #831843, #500724)',
    accentGradient: 'linear-gradient(to right, #f472b6, #fb7185)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(80, 7, 36, 0.4))',
    textColorPrimary: '#ffffff',
    textColorSecondary: 'rgba(255, 255, 255, 0.7)',
    accentPrimary: '#f472b6',
    accentSecondary: '#fb7185',
    bgPrimary: '#831843',
    bgSecondary: 'rgba(255, 255, 255, 0.12)',
    bgBackdrop: 'rgba(80, 7, 36, 0.85)',
    error: '#ffffff',
    success: '#ffffff',
    onAccent: '#500724',
    patternOpacity: '0.02'
  }
};

const softDaylight: Theme = {
  id: 'modern-minimal',
  name: 'Soft Daylight',
  description: 'Clean, modern, and easy on the eyes.',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
    accentGradient: 'linear-gradient(to right, #94a3b8, #64748b)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #f3f4f6)',
    textColorPrimary: '#1f2937',
    textColorSecondary: '#6b7280',
    accentPrimary: '#94a3b8',
    accentSecondary: '#64748b',
    bgPrimary: '#ffffff',
    bgSecondary: '#f3f4f6',
    bgBackdrop: 'rgba(255, 255, 255, 0.2)',
    error: '#dc2626',
    success: '#16a34a',
    onAccent: '#ffffff',
    patternOpacity: '0.05'
  }
};

const creamGlow: Theme = {
  id: 'warm-parchment',
  name: 'Cream Glow',
  description: 'Warm, cozy, and relaxed browsing.',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #fffbeb, #fef3c7)',
    accentGradient: 'linear-gradient(to right, #d97706, #fbbf24)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #fffbeb)',
    textColorPrimary: '#451a03',
    textColorSecondary: '#92400e',
    accentPrimary: '#d97706',
    accentSecondary: '#fbbf24',
    bgPrimary: '#fffbeb',
    bgSecondary: '#fef3c7',
    bgBackdrop: 'rgba(254, 243, 199, 0.3)',
    error: '#991b1b',
    success: '#065f46',
    onAccent: '#ffffff',
    patternOpacity: '0.04'
  }
};

const twilightSlate: Theme = {
  id: 'slate-balance',
  name: 'Twilight Slate',
  description: 'Balanced mid-tone with a calm, neutral feel.',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #475569, #334155)',
    accentGradient: 'linear-gradient(to right, #a78bfa, #c084fc)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(51, 65, 85, 0.7))',
    textColorPrimary: '#f8fafc',
    textColorSecondary: '#cbd5e1',
    accentPrimary: '#a78bfa',
    accentSecondary: '#c084fc',
    bgPrimary: '#475569',
    bgSecondary: '#334155',
    bgBackdrop: 'rgba(0, 0, 0, 0.2)',
    error: '#fda4af',
    success: '#6ee7b7',
    onAccent: '#1e293b',
    patternOpacity: '0.03'
  }
};

export const themes: Theme[] = [
    midnightBlue,
    roseLight,
    softDaylight,
    creamGlow,
    twilightSlate,
];