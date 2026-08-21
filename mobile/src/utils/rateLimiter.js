// FILE: mobile/src/utils/rateLimiter.js
// Purpose: Client-side rate limiting to prevent API abuse and brute-force attacks
// Used by: LoginScreen, SignupScreen, MealLogs (scan), NiaScreen (chat)

const requestLog = {}; // { [key]: number[] } — timestamps of requests

// ── Check if a key is rate-limited ───────────────────────────
// Returns true if the caller should be blocked
export function isRateLimited(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();

  if (!requestLog[key]) requestLog[key] = [];

  // Remove timestamps outside the current window
  requestLog[key] = requestLog[key].filter((t) => now - t < windowMs);

  if (requestLog[key].length >= maxRequests) {
    return true;
  }

  // Record this request
  requestLog[key].push(now);
  return false;
}

// ── Get remaining cooldown in milliseconds ────────────────────
export function getRemainingCooldownMs(key, windowMs = 60000) {
  const now = Date.now();
  if (!requestLog[key] || requestLog[key].length === 0) return 0;
  const oldest = Math.min(...requestLog[key]);
  return Math.max(0, windowMs - (now - oldest));
}

// ── Get remaining cooldown in seconds (rounded up) ───────────
export function getRemainingCooldownSecs(key, windowMs = 60000) {
  return Math.ceil(getRemainingCooldownMs(key, windowMs) / 1000);
}

// ── Reset a key's rate limit counter ─────────────────────────
export function resetRateLimit(key) {
  delete requestLog[key];
}

// ── Predefined rate limit configs ─────────────────────────────
export const RATE_LIMITS = {
  LOGIN: { key: 'auth_login', maxRequests: 5, windowMs: 30000 },       // 5 attempts per 30 sec
  SIGNUP: { key: 'auth_signup', maxRequests: 3, windowMs: 60000 },     // 3 attempts per min
  GOOGLE_AUTH: { key: 'auth_google', maxRequests: 3, windowMs: 30000 }, // 3 per 30 sec
  MEAL_SCAN: { key: 'meal_scan', maxRequests: 10, windowMs: 60000 },   // 10 scans per min
  NIA_CHAT: { key: 'nia_chat', maxRequests: 20, windowMs: 60000 },     // 20 messages per min
};
