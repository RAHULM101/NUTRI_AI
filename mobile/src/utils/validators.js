// FILE: mobile/src/utils/validators.js
// Purpose: Centralized input validation and sanitization layer for forms & user inputs

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates email format
 */
export function validateEmail(email = '') {
  const clean = String(email).trim().toLowerCase();
  if (!clean) return { valid: false, message: 'Email address is required' };
  if (!EMAIL_REGEX.test(clean)) return { valid: false, message: 'Please enter a valid email address' };
  return { valid: true, clean };
}

/**
 * Validates password length and strength
 */
export function validatePassword(password = '') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

/**
 * Validates numeric ranges for body metrics (weight, height, calories)
 */
export function validateMetric(val, { min = 0, max = 10000, name = 'Value' } = {}) {
  const num = parseFloat(val);
  if (isNaN(num)) return { valid: false, message: `${name} must be a number` };
  if (num < min) return { valid: false, message: `${name} cannot be less than ${min}` };
  if (num > max) return { valid: false, message: `${name} cannot exceed ${max}` };
  return { valid: true, value: num };
}

/**
 * Sanitizes user input string to prevent injection or formatting glitches
 */
export function sanitizeString(str = '') {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim();
}
