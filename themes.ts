import { Theme } from './types';

// --- Decorative SVG Patterns (Inanimate/Fixed) ---

// Scattered Cherry Blossoms - 🌸
const sakuraPattern = "url(\"data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='15' y='25' font-size='14' opacity='0.4'%3E🌸%3C/text%3E%3Ctext x='75' y='45' font-size='10' opacity='0.2'%3E🌸%3C/text%3E%3Ctext x='45' y='85' font-size='16' opacity='0.3'%3E🌸%3C/text%3E%3Ctext x='85' y='90' font-size='8' opacity='0.15'%3E🌸%3C/text%3E%3Ctext x='10' y='60' font-size='12' opacity='0.25'%3E🌸%3C/text%3E%3C/svg%3E\")";

// Scattered Vanilla Flowers - 🌼
const vanillaPattern = "url(\"data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='20' y='35' font-size='14' opacity='0.3'%3E🌼%3C/text%3E%3Ctext x='80' y='25' font-size='10' opacity='0.1'%3E🌼%3C/text%3E%3Ctext x='55' y='75' font-size='18' opacity='0.2'%3E🌼%3C/text%3E%3Ctext x='95' y='95' font-size='8' opacity='0.08'%3E🌼%3C/text%3E%3Ctext x='15' y='65' font-size='12' opacity='0.15'%3E🌼%3C/text%3E%3C/svg%3E\")";

// --- THEME REGISTRY ---

const midnightBlue: Theme = {
  id: 'noir-electric',
  name: 'Midnight Blue',
  description: 'Cinematic obsidian with anamorphic lens-flare accents.',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(135deg, #020617 0%, #000000 100%)',
    accentGradient: 'linear-gradient(to right, #2e5cfc, #0ea5e9)',
    cardGradient: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(0, 0, 0, 0.9))',
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

const sakuraSerenity: Theme = {
  id: 'sakura-blossom',
  name: 'Sakura Serenity',
  description: 'A serene spring afternoon with fixed cherry blossom petals.',
  base: 'light',
  colors: {
    bgGradient: `${sakuraPattern}, linear-gradient(rgba(255, 245, 247, 0.93), rgba(255, 245, 247, 0.85)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2000&auto=format&fit=crop')`,
    accentGradient: 'linear-gradient(to right, #FFB7C5, #FA8072)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 209, 220, 0.3))',
    textColorPrimary: '#3D2422', 
    textColorSecondary: 'rgba(61, 36, 34, 0.7)',
    accentPrimary: '#FFB7C5',
    accentSecondary: '#FA8072',
    bgPrimary: '#FFF5F7',
    bgSecondary: 'rgba(255, 183, 197, 0.2)',
    bgBackdrop: 'rgba(255, 245, 247, 0.4)',
    error: '#E57373',
    success: '#81C784',
    onAccent: '#ffffff',
    patternOpacity: '0.02'
  }
};

const velvetVanilla: Theme = {
  id: 'vanilla-bean',
  name: 'Velvet Vanilla',
  description: 'Smooth ivory aesthetic with fixed vanilla flowers.',
  base: 'light',
  colors: {
    bgGradient: `${vanillaPattern}, linear-gradient(rgba(253, 252, 240, 0.95), rgba(253, 252, 240, 0.85)), url('https://images.unsplash.com/photo-1614084153099-28c92a945f34?q=80&w=2000&auto=format&fit=crop')`,
    accentGradient: 'linear-gradient(to right, #C2A14E, #8B4513)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(243, 229, 171, 0.2))',
    textColorPrimary: '#4E342E', 
    textColorSecondary: 'rgba(78, 52, 46, 0.7)',
    accentPrimary: '#C2A14E',
    accentSecondary: '#8B4513',
    bgPrimary: '#FDFCF0',
    bgSecondary: 'rgba(194, 161, 78, 0.1)',
    bgBackdrop: 'rgba(253, 252, 240, 0.5)',
    error: '#B03A2E',
    success: '#1E8449',
    onAccent: '#ffffff',
    patternOpacity: '0.03'
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

const valentinesDay: Theme = {
  id: 'valentines-day',
  name: 'Valentine\'s Day',
  description: 'A romantic atmosphere of deep reds and soft pinks with falling hearts and flowers.',
  base: 'dark',
  holidayDate: { month: 1, day: 14 }, // February 14th
  colors: {
    bgGradient: 'linear-gradient(135deg, #590d22 0%, #800f2f 50%, #a4133c 100%)',
    accentGradient: 'linear-gradient(to right, #ff4d6d, #ff758f)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 77, 109, 0.15), rgba(0, 0, 0, 0.4))',
    textColorPrimary: '#fff0f3',
    textColorSecondary: 'rgba(255, 184, 199, 0.8)',
    accentPrimary: '#ff4d6d',
    accentSecondary: '#ff758f',
    bgPrimary: '#590d22',
    bgSecondary: 'rgba(255, 77, 109, 0.15)',
    bgBackdrop: 'rgba(89, 13, 34, 0.8)',
    error: '#ff85a1',
    success: '#34d399',
    onAccent: '#ffffff',
    particleEffect: ['hearts', 'flowers'],
    patternOpacity: '0.02'
  }
};

export const themes: Theme[] = [
    midnightBlue,
    sakuraSerenity,
    velvetVanilla,
    roseLight,
    softDaylight,
    creamGlow,
    twilightSlate,
    valentinesDay,
];
