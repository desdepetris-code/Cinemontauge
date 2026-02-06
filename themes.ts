import { Theme } from './types';

// --- Decorative SVG Patterns ---
const sakuraPattern = "url(\"data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='15' y='25' font-size='14' opacity='0.4'%3E🌸%3C/text%3E%3Ctext x='75' y='45' font-size='10' opacity='0.2'%3E🌸%3C/text%3E%3Ctext x='45' y='85' font-size='16' opacity='0.3'%3E🌸%3C/text%3E%3Ctext x='85' y='90' font-size='8' opacity='0.15'%3E🌸%3C/text%3E%3Ctext x='10' y='60' font-size='12' opacity='0.25'%3E🌸%3C/text%3E%3C/svg%3E\")";
const vanillaPattern = "url(\"data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='20' y='35' font-size='14' opacity='0.3'%3E🌼%3C/text%3E%3Ctext x='80' y='25' font-size='10' opacity='0.1'%3E🌼%3C/text%3E%3Ctext x='55' y='75' font-size='18' opacity='0.2'%3E🌼%3C/text%3E%3Ctext x='95' y='95' font-size='8' opacity='0.08'%3E🌼%3C/text%3E%3Ctext x='15' y='65' font-size='12' opacity='0.15'%3E🌼%3C/text%3E%3C/svg%3E\")";

const midnightBlue: Theme = {
  id: 'noir-electric',
  name: 'Midnight Blue',
  description: 'Pure black background with electric blue fonts and white titles.',
  base: 'dark',
  colors: {
    bgPrimary: '#000000',
    bgSecondary: '#0a0a0a',
    surfaceCard: 'rgba(20, 20, 20, 0.8)',
    surfaceModal: '#000000',
    textPrimary: '#FFFFFF', // White font color for titles
    textSecondary: '#4DA3FF', // Blue font color for metadata
    accent: '#4DA3FF', // Vibrant Royal Blue accent
    success: '#2ECC71',
    warning: '#F5A623',
    error: '#E74C3C',
    border: 'rgba(77, 163, 255, 0.2)',
    buttonPrimary: '#4DA3FF',
    buttonSecondary: '#111111',
    bgGradient: 'linear-gradient(180deg, #000000 0%, #050505 100%)',
    accentGradient: 'linear-gradient(to right, #4DA3FF, #0052cc)',
    cardGradient: 'linear-gradient(to bottom, rgba(15, 15, 15, 0.9), rgba(0, 0, 0, 1))',
    bgBackdrop: 'rgba(0, 0, 0, 0.98)',
    onAccent: '#000000',
    patternOpacity: '0.01'
  }
};

const sakuraSerenity: Theme = {
  id: 'sakura-blossom',
  name: 'Sakura Serenity',
  description: 'A serene spring afternoon with fixed cherry blossom petals.',
  base: 'light',
  colors: {
    bgPrimary: '#FFF5F7',
    bgSecondary: 'rgba(255, 183, 197, 0.2)',
    surfaceCard: 'rgba(255, 255, 255, 0.95)',
    surfaceModal: '#FFF5F7',
    textPrimary: '#3D2422',
    textSecondary: 'rgba(61, 36, 34, 0.7)',
    accent: '#FFB7C5',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#E57373',
    border: 'rgba(255, 183, 197, 0.3)',
    buttonPrimary: '#FFB7C5',
    buttonSecondary: 'rgba(255, 183, 197, 0.4)',
    bgGradient: `${sakuraPattern}, linear-gradient(rgba(255, 245, 247, 0.93), rgba(255, 245, 247, 0.85)), url('https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2000&auto=format&fit=crop')`,
    accentGradient: 'linear-gradient(to right, #FFB7C5, #FA8072)',
    cardGradient: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 209, 220, 0.3))',
    bgBackdrop: 'rgba(255, 245, 247, 0.4)',
    patternOpacity: '0.02'
  }
};

export const themes: Theme[] = [
    midnightBlue,
    sakuraSerenity,
];