// FILE: mobile/src/utils/logger.js
// Purpose: Production-safe structured logger with error sanitization

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
  info: (...args) => {
    if (isDev) {
      console.log('[NutriAI Info]:', ...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn('[NutriAI Warning]:', ...args);
    }
  },
  error: (label, error) => {
    if (isDev) {
      console.error(`[NutriAI Error] ${label}:`, error);
    }
    // In production, we avoid dumping full stack traces to raw console to avoid memory & security leaks
  },
};
