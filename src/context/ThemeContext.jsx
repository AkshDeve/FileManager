import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getThemeById, darkTheme } from '../themes/index.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('openvault-theme') || 'dark';
  });
  const [customTheme, setCustomTheme] = useState(() => {
    const saved = localStorage.getItem('openvault-custom-theme');
    return saved ? JSON.parse(saved) : null;
  });

  const theme = customTheme || getThemeById(themeId);

  useEffect(() => {
    localStorage.setItem('openvault-theme', themeId);
  }, [themeId]);

  useEffect(() => {
    if (customTheme) {
      localStorage.setItem('openvault-custom-theme', JSON.stringify(customTheme));
    }
  }, [customTheme]);

  // Apply CSS variables to root
  useEffect(() => {
    const root = document.documentElement;
    const c = theme.colors;
    root.style.setProperty('--bg-primary', c.bgPrimary);
    root.style.setProperty('--bg-secondary', c.bgSecondary);
    root.style.setProperty('--bg-tertiary', c.bgTertiary);
    root.style.setProperty('--bg-hover', c.bgHover);
    root.style.setProperty('--bg-active', c.bgActive);
    root.style.setProperty('--bg-card', c.bgCard);
    root.style.setProperty('--bg-input', c.bgInput);
    root.style.setProperty('--bg-modal', c.bgModal);
    root.style.setProperty('--bg-tooltip', c.bgTooltip);
    root.style.setProperty('--bg-context-menu', c.bgContextMenu);
    root.style.setProperty('--bg-context-hover', c.bgContextHover);

    root.style.setProperty('--text-primary', c.textPrimary);
    root.style.setProperty('--text-secondary', c.textSecondary);
    root.style.setProperty('--text-tertiary', c.textTertiary);
    root.style.setProperty('--text-inverse', c.textInverse);
    root.style.setProperty('--text-link', c.textLink);

    root.style.setProperty('--border-primary', c.borderPrimary);
    root.style.setProperty('--border-secondary', c.borderSecondary);
    root.style.setProperty('--border-focus', c.borderFocus);

    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-hover', c.accentHover);
    root.style.setProperty('--accent-light', c.accentLight);
    root.style.setProperty('--accent-dark', c.accentDark);

    root.style.setProperty('--success', c.success);
    root.style.setProperty('--warning', c.warning);
    root.style.setProperty('--error', c.error);
    root.style.setProperty('--info', c.info);

    root.style.setProperty('--shadow', c.shadow);
    root.style.setProperty('--shadow-strong', c.shadowStrong);

    root.style.setProperty('--scrollbar', c.scrollbar);
    root.style.setProperty('--scrollbar-hover', c.scrollbarHover);

    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.bgPrimary);
  }, [theme]);

  const changeTheme = useCallback((id) => {
    setThemeId(id);
    setCustomTheme(null);
  }, []);

  const applyCustomTheme = useCallback((themeObj) => {
    setCustomTheme(themeObj);
  }, []);

  const resetTheme = useCallback(() => {
    setCustomTheme(null);
    setThemeId('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, themes: [getThemeById('light'), getThemeById('dark'), getThemeById('ocean'), getThemeById('forest'), getThemeById('sunset')], changeTheme, applyCustomTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}