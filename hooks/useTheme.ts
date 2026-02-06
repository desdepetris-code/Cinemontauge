import { useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes } from '../themes';
import { Theme } from '../types';

const hexToRgbValues = (hex: string): string => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (!result) return '0, 0, 0';
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `${r}, ${g}, ${b}`;
};

const mixColors = (c1: string, c2: string, weight: number) => {
    const hex1 = c1.replace('#', '');
    const hex2 = c2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * (1 - weight) + r2 * weight);
    const g = Math.round(g1 * (1 - weight) + g2 * weight);
    const b = Math.round(b1 * (1 - weight) + b2 * weight);
    
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function useTheme(): [Theme, (themeId: string) => void, string] {
  const [preferredThemeId, setPreferredThemeId] = useLocalStorage<string>('preferredThemeId', 'noir-electric');
  
  const prevThemeIdRef = useRef<string | null>(null);
  
  const activeTheme = useMemo(() => {
    return builtInThemes.find(t => t.id === preferredThemeId) || builtInThemes[0];
  }, [preferredThemeId]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;
    if (prevThemeIdRef.current) body.classList.remove(`theme-${prevThemeIdRef.current}`);
    body.classList.add(`theme-${activeTheme.id}`);
    prevThemeIdRef.current = activeTheme.id;
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme.base);

    root.style.setProperty('--bg-primary', activeTheme.colors.bgPrimary);
    root.style.setProperty('--bg-secondary', activeTheme.colors.bgSecondary);
    root.style.setProperty('--surface-card', activeTheme.colors.surfaceCard);
    root.style.setProperty('--surface-modal', activeTheme.colors.surfaceModal);
    root.style.setProperty('--text-primary', activeTheme.colors.textPrimary);
    root.style.setProperty('--text-secondary', activeTheme.colors.textSecondary);
    root.style.setProperty('--accent', activeTheme.colors.accent);
    root.style.setProperty('--accent-rgb', hexToRgbValues(activeTheme.colors.accent));
    root.style.setProperty('--success', activeTheme.colors.success);
    root.style.setProperty('--warning', activeTheme.colors.warning);
    root.style.setProperty('--error', activeTheme.colors.error);
    root.style.setProperty('--border-color', activeTheme.colors.border);
    root.style.setProperty('--btn-primary', activeTheme.colors.buttonPrimary);
    root.style.setProperty('--btn-secondary', activeTheme.colors.buttonSecondary);

    root.style.setProperty('--bg-gradient', activeTheme.colors.bgGradient);
    root.style.setProperty('--accent-gradient', activeTheme.colors.accentGradient);
    root.style.setProperty('--card-gradient', activeTheme.colors.cardGradient);
    root.style.setProperty('--color-bg-backdrop', activeTheme.colors.bgBackdrop);
    root.style.setProperty('--on-accent', activeTheme.colors.onAccent || (activeTheme.base === 'dark' ? '#FFFFFF' : '#000000'));
    root.style.setProperty('--pattern-opacity', activeTheme.colors.patternOpacity || '0.05');
    root.style.setProperty('--font-journal', activeTheme.colors.fontJournal || "'Domine', serif");

    const c1 = activeTheme.colors.accent;
    const c2 = activeTheme.colors.bgSecondary;
    for (let i = 0; i < 10; i++) {
        const weight = i / 9;
        root.style.setProperty(`--nav-c${i+1}`, mixColors(c1, c2, weight));
    }
  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (builtInThemes.some(t => t.id === newThemeId)) {
        setPreferredThemeId(newThemeId);
    }
  };

  return [activeTheme, setTheme, preferredThemeId];
}
