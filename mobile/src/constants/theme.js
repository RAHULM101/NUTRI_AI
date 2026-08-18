// FILE: mobile/src/constants/theme.js
// Purpose: Centralized design system — colors, typography, spacing, shadows
// Mirrors NutriAI web branding: emerald-teal palette, dark/light modes

import { Platform } from 'react-native';

export const COLORS = {
  // Brand
  primary: '#10b981',        // emerald-500
  primaryDark: '#059669',    // emerald-600
  primaryDeep: '#047857',    // emerald-700
  teal: '#14B8A6',           // teal-500 (Dashboard accent)
  tealLight: '#99F6E4',      // teal-200

  // Background
  bgLight: '#f8fafc',        // slate-50
  bgWhite: '#ffffff',
  bgDark: '#0f172a',         // slate-900
  bgDarker: '#020617',       // slate-950

  // Surface
  surfaceLight: '#ffffff',
  surfaceMuted: '#f1f5f9',   // slate-100
  surfaceDark: '#1e293b',    // slate-800
  surfaceDarker: '#0f172a',  // slate-900

  // Text
  textPrimary: '#0f172a',    // slate-900
  textSecondary: '#475569',  // slate-600
  textMuted: '#94a3b8',      // slate-400
  textLight: '#ffffff',
  textDark: '#f8fafc',

  // Border
  border: '#e2e8f0',         // slate-200
  borderDark: '#334155',     // slate-700
  borderMuted: 'rgba(255,255,255,0.1)',

  // Semantic
  error: '#ef4444',          // red-500
  errorLight: '#fee2e2',
  warning: '#f59e0b',        // amber-500
  warningLight: '#fef3c7',
  success: '#22c55e',        // green-500
  successLight: '#dcfce7',
  info: '#3b82f6',           // blue-500

  // Macro Colors
  protein: '#3b82f6',        // blue-500
  carbs: '#f59e0b',          // amber-500
  fat: '#ec4899',            // pink-500
  calories: '#14B8A6',       // teal-500
  water: '#0ea5e9',          // sky-500
  junk: '#f87171',           // red-400

  // Glassmorphism
  glassBg: 'rgba(255,255,255,0.12)',
  glassBgDark: 'rgba(15,23,42,0.65)',
  glassBorder: 'rgba(255,255,255,0.20)',
  glassBorderDark: 'rgba(255,255,255,0.08)',

  // Sidebar (mirrors web)
  sidebarBg: '#0D9488',      // teal-600
  sidebarCard: '#0F766E',    // teal-700
};

export const FONTS = {
  // React Native uses system fonts — closest match to web Inter/Outfit
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  emerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  teal: {
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
};

// Gradient configs for LinearGradient
export const GRADIENTS = {
  primary: ['#10b981', '#059669', '#047857'],
  teal: ['#14B8A6', '#0D9488'],
  dark: ['#0f172a', '#1e293b'],
  card: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
};
