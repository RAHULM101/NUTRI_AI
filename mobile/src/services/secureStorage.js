// FILE: mobile/src/services/secureStorage.js
// Purpose: Encrypted token storage using expo-secure-store
// Replaces: raw AsyncStorage for the JWT access token (security fix)
// Falls back gracefully to AsyncStorage if SecureStore is unavailable (e.g., simulator edge cases)

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_TOKEN_KEY = 'nutriai_access_token_secure';
const LEGACY_TOKEN_KEY = 'access_token'; // old AsyncStorage key for migration

// ── Save token securely ───────────────────────────────────────
export async function saveTokenSecure(token) {
  if (!token) return;
  try {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
    // Remove legacy plain token if it exists
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
  } catch {
    // Fallback: store in AsyncStorage if SecureStore fails
    await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
  }
}

// ── Retrieve token (with legacy migration) ────────────────────
export async function getTokenSecure() {
  try {
    // Try SecureStore first
    const secureToken = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    if (secureToken) return secureToken.replace(/['\"]+/g, '');

    // Migrate legacy token from AsyncStorage → SecureStore
    const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      const clean = legacy.replace(/['\"]+/g, '');
      await saveTokenSecure(clean); // migrate to secure storage
      return clean;
    }

    return null;
  } catch {
    // Final fallback to AsyncStorage
    const raw = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    return raw ? raw.replace(/['\"]+/g, '') : null;
  }
}

// ── Clear token from both stores ──────────────────────────────
export async function clearTokenSecure() {
  try {
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  } catch {}
  await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
}

// ── Check if a valid (non-empty) token exists ─────────────────
export async function hasTokenSecure() {
  const token = await getTokenSecure();
  return !!token;
}
