
import { useEffect, useRef, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes as builtInThemes, holidayThemes } from '../themes';
import { Theme } from '../types';

// FIX: Added getNextHoliday helper to calculate the next holiday based on the current date.
export const getNextHoliday = (date: Date) => {
  const currentYear = date.getFullYear();
  
  const holidays = [
    { name: "New Year's Eve", month: 11, day: 31, id: 'holiday-new-years-eve', daysBefore: 1 },
    { name: 'New Year', month: 0, day: 1, id: 'holiday-new-year', daysBefore: 1 },
    { name: "Valentine's Day", month: 1, day: 14, id: 'holiday-valentines', daysBefore: 3 },
    { name: 'Easter', month: 3, day: 9, id: 'holiday-easter', daysBefore: 3 }, // Fixed for 2025
    { name: "Mother's Day", month: 4, day: 11, id: 'holiday-mothers-day', daysBefore: 3 }, // 2025
    { name: "Father's Day", month: 5, day: 15, id: 'holiday-fathers-day', daysBefore: 3 }, // 2025
    { name: "Independence Day", month: 6, day: 4, id: 'holiday-independence-day', daysBefore: 3 },
    { name: 'Halloween', month: 9, day: 31, id: 'holiday-halloween', daysBefore: 7 },
    { name: 'Thanksgiving', month: 10, day: 27, id: 'holiday-thanksgiving', daysBefore: 3 }, // 2025
    { name: 'Christmas', month: 11, day: 25, id: 'holiday-christmas', daysBefore: 7 },
  ];

  const upcomingHolidays = holidays.map(h => {
    const holidayDate = new Date(currentYear, h.month, h.day);
    if (holidayDate < date && (date.getMonth() !== h.month || date.getDate() !== h.day)) {
        holidayDate.setFullYear(currentYear + 1);
    }
    const startDate = new Date(holidayDate);
    startDate.setDate(holidayDate.getDate() - h.daysBefore);
    return { ...h, date: holidayDate, startDate };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  return upcomingHolidays[0];
};

// FIX: Updated useTheme to accept autoHolidayThemesEnabled and return correct theme based on current date if enabled.
export function useTheme(customThemes: Theme[], autoHolidayThemesEnabled: boolean = false): [Theme, (themeId: string) => void] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');
  const prevThemeIdRef = useRef<string | null>(null);

  const allThemes = useMemo(() => [...builtInThemes, ...holidayThemes, ...customThemes], [customThemes]);
  
  const activeTheme = useMemo(() => {
    if (autoHolidayThemesEnabled) {
      const now = new Date();
      const nextHoliday = getNextHoliday(now);
      const holidayTheme = holidayThemes.find(t => t.id === nextHoliday.id);
      
      if (holidayTheme && now >= nextHoliday.startDate && now <= nextHoliday.date) {
        return holidayTheme;
      }
    }
    return allThemes.find(t => t.id === themeId) || builtInThemes[0];
  }, [themeId, allThemes, autoHolidayThemesEnabled]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    const body = document.body;

    if (prevThemeIdRef.current) {
        body.classList.remove(`theme-${prevThemeIdRef.current}`);
    }
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
  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (allThemes.some(t => t.id === newThemeId)) {
        setThemeId(newThemeId);
    }
  };

  return [activeTheme, setTheme];
}
