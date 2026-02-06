import { useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes } from '../themes';
import { Theme } from '../types';

const hexToRgbValues = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
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

/**
 * Checks if a date falls within 14 days before a holiday, up until the day of.
 */
export const isHolidayActive = (holidayDate: { month: number; day: number }) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Create the holiday date for the current year
    const holiday = new Date(currentYear, holidayDate.month, holidayDate.day);
    
    // Window start: 14 days before
    const start = new Date(holiday);
    start.setDate(holiday.getDate() - 14);
    
    // Window end: end of the holiday day (1 day after holiday at midnight)
    const end = new Date(holiday);
    end.setDate(holiday.getDate() + 1);

    return now >= start && now < end;
};

export function useTheme(): [Theme, (themeId: string) => void, string, boolean, (enabled: boolean) => void] {
  // preferredThemeId stores the user's manual selection
  const [preferredThemeId, setPreferredThemeId] = useLocalStorage<string>('preferredThemeId', 'noir-electric');
  // autoHolidayThemesEnabled determines if the app should auto-switch
  const [autoHolidayEnabled, setAutoHolidayEnabled] = useLocalStorage<boolean>('autoHolidayThemesEnabled', true);
  
  const prevThemeIdRef = useRef<string | null>(null);
  
  const activeTheme = useMemo(() => {
    // 1. If auto-holiday is enabled, look for an active holiday theme
    if (autoHolidayEnabled) {
        const holidayTheme = builtInThemes.find(t => t.holidayDate && isHolidayActive(t.holidayDate));
        if (holidayTheme) return holidayTheme;
    }

    // 2. Otherwise return user preferred theme
    return builtInThemes.find(t => t.id === preferredThemeId) || builtInThemes[0];
  }, [preferredThemeId, autoHolidayEnabled]);
  
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
    root.style.setProperty('--color-accent-primary-rgb', hexToRgbValues(activeTheme.colors.accentPrimary));
    root.style.setProperty('--color-accent-secondary', activeTheme.colors.accentSecondary);
    root.style.setProperty('--color-bg-primary', activeTheme.colors.bgPrimary);
    root.style.setProperty('--color-bg-secondary', activeTheme.colors.bgSecondary);
    root.style.setProperty('--color-bg-backdrop', activeTheme.colors.bgBackdrop);
    root.style.setProperty('--on-accent', activeTheme.colors.onAccent || (activeTheme.base === 'dark' ? '#FFFFFF' : '#000000'));
    
    root.style.setProperty('--pattern-opacity', activeTheme.colors.patternOpacity || '0.05');
    root.style.setProperty('--color-error', activeTheme.colors.error || '#EF4444');
    root.style.setProperty('--color-success', activeTheme.colors.success || '#22C55E');
    root.style.setProperty('--font-journal', activeTheme.colors.fontJournal || "'Domine', serif");

    const c1 = activeTheme.colors.accentPrimary;
    const c2 = activeTheme.colors.accentSecondary;
    for (let i = 0; i < 10; i++) {
        const weight = i / 9;
        root.style.setProperty(`--nav-c${i+1}`, mixColors(c1, c2, weight));
    }
  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (builtInThemes.some(t => t.id === newThemeId)) {
        setPreferredThemeId(newThemeId);
        // If they manually select something during a holiday, we'll let it stick?
        // Actually, the prompt implies "activated two weeks prior... disappear day after".
        // To strictly follow that while allowing choice, we'll keep preferredThemeId as the base.
    }
  };

  return [activeTheme, setTheme, preferredThemeId, autoHolidayEnabled, setAutoHolidayEnabled];
}
