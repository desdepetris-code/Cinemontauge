
import { useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes, holidayThemes } from '../themes';
import { Theme } from '../types';

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

interface HolidayDef {
    name: string;
    month: number; // 0-11
    day: number;
    durationDays: number;
    themeId: string;
}

const HOLIDAYS: HolidayDef[] = [
    { name: 'Halloween', month: 9, day: 31, durationDays: 7, themeId: 'holiday-halloween' },
    { name: 'Winter Holidays', month: 11, day: 25, durationDays: 14, themeId: 'winter-ice' },
    { name: 'New Year', month: 0, day: 1, durationDays: 3, themeId: 'cyberpunk-city' },
    { name: 'Valentine\'s Day', month: 1, day: 14, durationDays: 3, themeId: 'holiday-valentines' },
];

export function getCurrentHoliday(date: Date): HolidayDef | null {
    for (const holiday of HOLIDAYS) {
        const holidayDate = new Date(date.getFullYear(), holiday.month, holiday.day);
        const startDate = new Date(holidayDate);
        startDate.setDate(holidayDate.getDate() - Math.floor(holiday.durationDays / 2));
        const endDate = new Date(holidayDate);
        endDate.setDate(holidayDate.getDate() + Math.ceil(holiday.durationDays / 2));
        
        if (date >= startDate && date <= endDate) {
            return holiday;
        }
    }
    return null;
}

export function getNextHoliday(date: Date): { name: string; date: Date } {
    const sorted = [...HOLIDAYS].map(h => {
        let hDate = new Date(date.getFullYear(), h.month, h.day);
        if (hDate < date) hDate = new Date(date.getFullYear() + 1, h.month, h.day);
        return { name: h.name, date: hDate };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return sorted[0];
}

export function useTheme(customThemes: Theme[], autoHolidayThemesEnabled: boolean = false): [Theme, (themeId: string) => void, string, string | null] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');
  const prevThemeIdRef = useRef<string | null>(null);
  const allThemes = useMemo(() => [...builtInThemes, ...holidayThemes, ...customThemes], [customThemes]);
  
  const holidayOverride = useMemo(() => {
    if (!autoHolidayThemesEnabled) return null;
    const current = getCurrentHoliday(new Date());
    if (!current) return null;
    return allThemes.find(t => t.id === current.themeId) || null;
  }, [autoHolidayThemesEnabled, allThemes]);

  const activeTheme = useMemo(() => {
    if (holidayOverride) return holidayOverride;
    return allThemes.find(t => t.id === themeId) || builtInThemes[0];
  }, [themeId, allThemes, holidayOverride]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;
    if (prevThemeIdRef.current) body.classList.remove(`theme-${prevThemeIdRef.current}`);
    body.classList.add(`theme-${activeTheme.id}`);
    prevThemeIdRef.current = activeTheme.id;
    root.classList.remove('light', 'dark');
    root.classList.add(activeTheme.base);

    root.style.setProperty('--bg-gradient', activeTheme.colors.bgGradient);
    root.style.setProperty('--accent-gradient', activeTheme.colors.accentGradient);
    root.style.setProperty('--card-gradient', activeTheme.colors.cardGradient);
    root.style.setProperty('--text-color-primary', activeTheme.colors.textColorPrimary);
    root.style.setProperty('--text-color-secondary', activeTheme.colors.textColorSecondary);
    root.style.setProperty('--color-accent-primary', activeTheme.colors.accentPrimary);
    root.style.setProperty('--color-accent-secondary', activeTheme.colors.accentSecondary);
    root.style.setProperty('--color-bg-primary', activeTheme.colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', activeTheme.colors.bgSecondary);
    root.style.setProperty('--color-bg-backdrop', activeTheme.colors.bgBackdrop);
    root.style.setProperty('--on-accent', activeTheme.colors.onAccent || (activeTheme.base === 'dark' ? '#FFFFFF' : '#000000'));
    
    // Pattern & Functional Colors
    root.style.setProperty('--pattern-opacity', activeTheme.colors.patternOpacity || '0.05');
    root.style.setProperty('--color-error', activeTheme.colors.error || '#EF4444');
    root.style.setProperty('--color-success', activeTheme.colors.success || '#22C55E');

    // Fonts
    root.style.setProperty('--font-journal', activeTheme.colors.fontJournal || "'Domine', serif");

    const c1 = activeTheme.colors.accentPrimary;
    const c2 = activeTheme.colors.accentSecondary;
    for (let i = 0; i < 10; i++) {
        const weight = i / 9;
        root.style.setProperty(`--nav-c${i+1}`, mixColors(c1, c2, weight));
    }
  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (allThemes.some(t => t.id === newThemeId)) setThemeId(newThemeId);
  };

  return [activeTheme, setTheme, themeId, holidayOverride?.name || null];
}
