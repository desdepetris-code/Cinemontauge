import { Theme } from './types';

// Original Themes
const originalDark: Theme = {
  id: 'original-dark',
  name: 'Original Dark',
  base: 'dark',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #330000, #8B0000, #FF0000)',
    accentGradient: 'linear-gradient(to right, #8B0000, #FF0000)',
    cardGradient: 'linear-gradient(to bottom, rgba(43, 43, 80, 0.5), rgba(26, 26, 46, 0.7))',
    textColorPrimary: '#FFFFFF',
    textColorSecondary: '#C0C0C0',
    accentPrimary: '#FF0000',
    accentSecondary: '#8B0000',
    bgPrimary: 'rgba(26, 26, 46, 0.7)',
    bgSecondary: 'rgba(255, 255, 255, 0.1)',
    bgBackdrop: 'rgba(0, 0, 0, 0.3)',
  }
};

const originalLight: Theme = {
  id: 'original-light',
  name: 'Original Light',
  base: 'light',
  colors: {
    bgGradient: 'linear-gradient(to bottom right, #FFC0CB, #FF69B4, #FF1493)',
    accentGradient: 'linear-gradient(to right, #FF69B4, #FF1493)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))',
    textColorPrimary: '#1A1A1A',
    textColorSecondary: '#666666',
    accentPrimary: '#FF1493',
    accentSecondary: '#FF69B4',
    bgPrimary: 'rgba(255, 255, 255, 0.3)',
    bgSecondary: 'rgba(0, 0, 0, 0.1)',
    bgBackdrop: 'rgba(255, 255, 255, 0.2)',
  }
};

// New Themes
const cinematicClassic: Theme = {
    id: 'cinematic-classic',
    name: 'Cinematic Classic',
    base: 'dark',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #1a1a1a, #2b2b2b, #3c3c3c)',
        accentGradient: 'linear-gradient(to right, #DAA520, #B8860B)',
        cardGradient: 'linear-gradient(to bottom, rgba(60, 60, 60, 0.5), rgba(43, 43, 43, 0.7))',
        textColorPrimary: '#F5F5DC', // beige
        textColorSecondary: '#A9A9A9', // dark gray
        accentPrimary: '#DAA520', // gold
        accentSecondary: '#B8860B', // darkgoldenrod
        bgPrimary: 'rgba(43, 43, 43, 0.7)',
        bgSecondary: 'rgba(245, 245, 220, 0.1)',
        bgBackdrop: 'rgba(26, 26, 26, 0.3)',
    }
};

const metallicModern: Theme = {
    id: 'metallic-modern',
    name: 'Metallic Modern',
    base: 'dark',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #36454F, #4C5D6A)',
        accentGradient: 'linear-gradient(to right, #C0C0C0, #B87333)',
        cardGradient: 'linear-gradient(to bottom, rgba(108, 122, 137, 0.5), rgba(76, 93, 106, 0.7))',
        textColorPrimary: '#EAEAEA',
        textColorSecondary: '#A9A9A9',
        accentPrimary: '#C0C0C0', // silver
        accentSecondary: '#B87333', // copper
        bgPrimary: 'rgba(76, 93, 106, 0.7)',
        bgSecondary: 'rgba(192, 192, 192, 0.1)',
        bgBackdrop: 'rgba(54, 69, 79, 0.3)',
    }
};

const pastelPlay: Theme = {
    id: 'pastel-play',
    name: 'Pastel Play',
    base: 'light',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #E6E6FA, #FFFACD, #F0FFF0)', // lavender, lemonchiffon, honeydew
        accentGradient: 'linear-gradient(to right, #FFB6C1, #FFC0CB)', // lightpink to pink
        cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7), rgba(240, 255, 255, 0.5))',
        textColorPrimary: '#483D8B', // darkslateblue
        textColorSecondary: '#778899', // lightslategray
        accentPrimary: '#FFB6C1', // lightpink
        accentSecondary: '#87CEEB', // skyblue
        bgPrimary: 'rgba(240, 255, 255, 0.5)',
        bgSecondary: 'rgba(72, 61, 139, 0.05)',
        bgBackdrop: 'rgba(255, 255, 255, 0.2)',
    }
};

const neonPop: Theme = {
    id: 'neon-pop',
    name: 'Neon Pop',
    base: 'dark',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #000000, #1A1A1A)',
        accentGradient: 'linear-gradient(to right, #FF00FF, #00FFFF)', // magenta to cyan
        cardGradient: 'linear-gradient(to bottom, rgba(255, 0, 255, 0.1), rgba(0, 255, 255, 0.1))',
        textColorPrimary: '#FFFFFF',
        textColorSecondary: '#BEBEBE',
        accentPrimary: '#FF00FF', // magenta
        accentSecondary: '#00FFFF', // cyan
        bgPrimary: 'rgba(26, 26, 26, 0.7)',
        bgSecondary: 'rgba(255, 255, 255, 0.1)',
        bgBackdrop: 'rgba(0, 0, 0, 0.3)',
    }
};

const lightElegance: Theme = {
    id: 'light-elegance',
    name: 'Light Elegance',
    base: 'light',
    colors: {
        bgGradient: 'linear-gradient(to bottom right, #FFFFF0, #FAF0E6)', // ivory to linen
        accentGradient: 'linear-gradient(to right, #D4AF37, #B76E79)', // gold to rose-gold
        cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.8), rgba(247, 231, 206, 0.4))',
        textColorPrimary: '#363636',
        textColorSecondary: '#5A5A5A',
        accentPrimary: '#D4AF37', // gold-like for accent
        accentSecondary: '#B76E79', // rose gold-like
        bgPrimary: 'rgba(247, 231, 206, 0.4)',
        bgSecondary: 'rgba(0, 0, 0, 0.05)',
        bgBackdrop: 'rgba(255, 250, 240, 0.2)',
    }
};


export const themes: Theme[] = [
    originalDark,
    originalLight,
    cinematicClassic,
    metallicModern,
    pastelPlay,
    neonPop,
    lightElegance,
];
