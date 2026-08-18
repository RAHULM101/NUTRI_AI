// FILE: mobile/src/context/ThemeContext.js
// Purpose: Global Light/Dark Theme Context with AsyncStorage persistence

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

const THEME_STORAGE_KEY = 'nutriai_theme_mode';

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  colors: COLORS,
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((val) => {
        if (val === 'dark') setIsDark(true);
        else if (val === 'light') setIsDark(false);
      })
      .catch((e) => console.warn('Could not load theme:', e));
  }, []);

  const toggleTheme = async () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light').catch((e) =>
        console.warn('Could not save theme:', e)
      );
      return next;
    });
  };

  // Color mappings for light/dark themes
  const themeColors = {
    ...COLORS,
    bg: isDark ? '#0f172a' : '#f8fafc',
    bgCard: isDark ? '#1e293b' : '#ffffff',
    bgCardMuted: isDark ? 'rgba(30,41,59,0.7)' : '#f1f5f9',
    text: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    border: isDark ? '#334155' : '#e2e8f0',
    glassBg: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
    glassBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
