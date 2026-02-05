import { Theme } from './types';

// --- THEMES ---

const radiantRed: Theme = {
  id: 'original-dark',
  name: 'Radiant Red',
  base: 'dark',
  colors: {
    bgGradient: 'radial-gradient(circle at top, #e11d48, #be123c, #881337)',
    accentGradient: 'linear-gradient(to right, #ffffff, #fecaca)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08), rgba(136, 19, 55, 0.4))',
    textColorPrimary: '#ffffff',
    textColorSecondary: '#ffffff', // Strictly white
    accentPrimary: '#ffffff', // For white glow highlights
    accentSecondary: '#ffffff',
    bgPrimary: '#be123c',
    bgSecondary: 'rgba(255, 255, 255, 0.12)',
    bgBackdrop: 'rgba(136, 19, 55, 0.85)',
    error: '#ffffff',
    success: '#ffffff',
    onAccent: '#881337', // Deep red for text ON solid white buttons
    patternOpacity: '0.02',
    fontJournal: "'Domine', serif"
  }
};

const cyberpunkCity: Theme = {
  id: 'cyberpunk-city',
  name: 'Cyberpunk City',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #030712, #1a011d)',
    accentGradient: 'linear-gradient(to right, #22d3ee, #ec4899)',
    cardGradient: 'linear-gradient(to bottom, rgba(20, 4, 32, 0.5), rgba(10, 2, 12, 0.7))',
    textColorPrimary: '#F0F9FF',
    textColorSecondary: '#94A3B8',
    accentPrimary: '#22D3EE',
    accentSecondary: '#EC4899',
    bgPrimary: '#110115',
    bgSecondary: 'rgba(34, 211, 238, 0.1)',
    bgBackdrop: 'rgba(17, 1, 21, 0.3)',
    error: '#FB7185',
    success: '#34D399',
    fontJournal: "'Roboto Slab', serif"
  }
};

const monochromeNoir: Theme = {
  id: 'monochrome-noir',
  name: 'Noir Redux',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #171717, #0a0a0a)',
    accentGradient: 'linear-gradient(to right, #DC2626, #ef4444)',
    cardGradient: 'linear-gradient(to bottom, rgba(38, 38, 38, 0.5), rgba(20, 20, 20, 0.7))',
    textColorPrimary: '#E5E5E5',
    textColorSecondary: '#737373',
    accentPrimary: '#DC2626',
    accentSecondary: '#ef4444',
    bgPrimary: '#0A0A0A',
    bgSecondary: 'rgba(255, 255, 255, 0.05)',
    bgBackdrop: 'rgba(10, 10, 10, 0.3)',
    error: '#F97316',
    success: '#FAFAFA',
    patternOpacity: '0.02',
    fontJournal: "'Domine', serif"
  },
};

const oledBlack: Theme = {
  id: 'oled-black',
  name: 'OLED Black',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #000000, #000000)',
    accentGradient: 'linear-gradient(to right, #6366F1, #4f46e5)',
    cardGradient: 'linear-gradient(to bottom, #111111, #000000)',
    textColorPrimary: '#FAFAFA',
    textColorSecondary: '#A1A1AA',
    accentPrimary: '#6366F1',
    accentSecondary: '#4f46e5',
    bgPrimary: '#000000',
    bgSecondary: '#09090b',
    bgBackdrop: 'rgba(0, 0, 0, 0.5)',
    error: '#EF4444',
    success: '#22C55E'
  }
};

const winterIce: Theme = {
  id: 'winter-ice',
  name: 'Winter Ice',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom, #0F172A, #020617)',
    accentGradient: 'linear-gradient(to right, #38BDF8, #93C5FD)',
    cardGradient: 'linear-gradient(to bottom, rgba(30, 41, 59, 0.5), rgba(2, 6, 23, 0.7))',
    textColorPrimary: '#F1F5F9',
    textColorSecondary: '#94A3B8',
    accentPrimary: '#38BDF8',
    accentSecondary: '#93C5FD',
    bgPrimary: '#020617',
    bgSecondary: 'rgba(56, 189, 248, 0.1)',
    bgBackdrop: 'rgba(2, 6, 23, 0.3)',
    error: '#FDA4AF',
    success: '#99F6E4',
    particleEffect: ['snow', 'sparkles']
  }
};

const halloweenNight: Theme = {
    id: 'holiday-halloween',
    name: 'Halloween Night',
    base: 'dark',
    colors: {
        bgGradient: 'linear-gradient(to bottom, #1a0b2e, #0c051a)',
        accentGradient: 'linear-gradient(to right, #f97316, #ea580c)',
        cardGradient: 'linear-gradient(to bottom, rgba(45, 20, 80, 0.4), rgba(20, 10, 30, 0.6))',
        textColorPrimary: '#fef3c7',
        textColorSecondary: 'rgba(214, 211, 209, 0.7)',
        accentPrimary: '#f97316',
        accentSecondary: '#fb923c',
        bgPrimary: '#0c051a',
        bgSecondary: '#1a0b2e',
        bgBackdrop: 'rgba(12, 5, 26, 0.5)',
        error: '#ef4444',
        success: '#4ade80',
        particleEffect: ['bats', 'ghosts', 'pumpkins']
    }
};

const valentinesDay: Theme = {
    id: 'holiday-valentines',
    name: 'Valentine\'s Day',
    base: 'light',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #fff1f2, #ffe4e6)',
        accentGradient: 'linear-gradient(to right, #e11d48, #be123c)',
        cardGradient: 'linear-gradient(to bottom, #ffffff, #fff1f2)',
        textColorPrimary: '#881337',
        textColorSecondary: 'rgba(159, 18, 57, 0.7)',
        accentPrimary: '#fb7185',
        accentSecondary: '#e11d48',
        bgPrimary: '#fff1f2',
        bgSecondary: '#ffe4e6',
        bgBackdrop: 'rgba(255, 241, 242, 0.3)',
        error: '#9f1239',
        success: '#059669',
        particleEffect: ['hearts', 'flowers']
    }
};

// --- LIGHT THEMES ---

const mintyFresh: Theme = {
  id: 'original-light',
  name: 'Minty Fresh',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #f0fdfa, #ccfbf1)',
    accentGradient: 'linear-gradient(to right, #14B8A6, #0d9488)',
    cardGradient: 'linear-gradient(to bottom, #ffffff, #f0fdfa)',
    textColorPrimary: '#0F766E',
    textColorSecondary: 'rgba(69, 123, 123, 0.8)',
    accentPrimary: '#14B8A6',
    accentSecondary: '#0d9488',
    bgPrimary: '#f0fdfa',
    bgSecondary: '#ccfbf1',
    bgBackdrop: 'rgba(240, 253, 250, 0.2)',
    error: '#B91C1C',
    success: '#059669',
    onAccent: '#000000',
    fontJournal: "'Roboto Slab', serif"
  }
};

const vintageSepia: Theme = {
  id: 'vintage-sepia',
  name: 'Old Parchment',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #fdf6e3, #e8dcb5)',
    accentGradient: 'linear-gradient(to right, #D97706, #4e342e)',
    cardGradient: 'linear-gradient(to bottom, rgba(253, 246, 227, 0.8), rgba(245, 222, 179, 0.9))',
    textColorPrimary: '#3E2723',
    textColorSecondary: '#795548',
    accentPrimary: '#D97706',
    accentSecondary: '#4e342e',
    bgPrimary: '#fdf6e3',
    bgSecondary: '#eee8d5',
    bgBackdrop: 'rgba(253, 246, 227, 0.2)',
    error: '#991B1B',
    success: '#15803D',
    patternOpacity: '0.08',
    fontJournal: "'Domine', serif"
  },
};

export const themes: Theme[] = [
    radiantRed,
    oledBlack,
    cyberpunkCity,
    monochromeNoir,
    winterIce,
    mintyFresh,
    vintageSepia,
];

export const holidayThemes: Theme[] = [
    winterIce,
    halloweenNight,
    valentinesDay,
];