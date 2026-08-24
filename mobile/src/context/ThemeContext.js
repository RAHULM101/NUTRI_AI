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
    bg: isDark ? COLORS.bgDark : COLORS.bgLight,
    bgCard: isDark ? COLORS.surfaceDark : COLORS.surfaceLight,
    bgCardMuted: isDark ? 'rgba(20, 29, 47, 0.75)' : '#F1F5F9',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
    borderSubtle: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
    glassBg: isDark ? 'rgba(20, 29, 47, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    glassBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
