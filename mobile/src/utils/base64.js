// FILE: mobile/src/utils/base64.js
// Purpose: Cross-platform Base64 decoder & JWT payload extractor
// Hermes-compatible — does NOT rely on browser global `atob` which crashes in React Native

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export function decodeBase64(input = '') {
  let str = String(input).replace(/=+$/, '');
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string');
  }
  let output = '';
  for (
    let bc = 0, bs = 0, buffer, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

/**
 * Safely decodes a JWT token without throwing exceptions.
 * Returns parsed payload object or empty object if invalid.
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return {};
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    // Replace URL-safe characters
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      decodeBase64(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    // Fallback: try raw decodeBase64
    try {
      const parts = token.split('.');
      const raw = decodeBase64(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
