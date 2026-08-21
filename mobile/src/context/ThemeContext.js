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
    bg: isDark ? '#0F172A' : '#F8FAFC',
    bgCard: isDark ? '#1E293B' : '#FFFFFF',
    bgCardMuted: isDark ? 'rgba(30,41,59,0.7)' : '#F1F5F9',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#CBD5E1' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
    glassBg: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
    glassBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
