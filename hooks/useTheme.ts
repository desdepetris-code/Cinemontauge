import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { themes } from '../themes';
import { Theme } from '../types';

export function useTheme(): [Theme, (themeId: string) => void] {
  const [themeId, setThemeId] = useLocalStorage<string>('themeId', 'original-dark');

  const activeTheme = themes.find(t => t.id === themeId) || themes[0];

  useEffect(() => {
    const root = window.document.documentElement;

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

  }, [activeTheme]);

  const setTheme = (newThemeId: string) => {
    if (themes.some(t => t.id === newThemeId)) {
        setThemeId(newThemeId);
    }
  };

  return [activeTheme, setTheme];
}
