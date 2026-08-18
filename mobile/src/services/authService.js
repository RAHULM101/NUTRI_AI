// FILE: mobile/src/services/authService.js
// Purpose: Login, Register, Logout, and token management
// Security: Token stored in expo-secure-store (encrypted) — not plain AsyncStorage
// Auth: JWT (Django SimpleJWT) — same backend endpoints as web

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { ENDPOINTS } from '../constants/apiConfig';
import {
  saveTokenSecure,
  getTokenSecure,
  clearTokenSecure,
  hasTokenSecure,
} from './secureStorage';

// ── Keys stored in AsyncStorage (non-sensitive data only) ──────
const ONBOARDED_KEY = 'nutriai_onboarded';
const PROFILE_KEY = 'nutriai_profile_data';

// ── Register new user ─────────────────────────────────────────
export async function registerUser(email, password, confirmPassword) {
  const response = await api.post(ENDPOINTS.register, {
    email,
    password,
    confirm_password: confirmPassword,
  });
  const { access_token, user } = response.data;
  if (access_token) {
    await saveTokenSecure(access_token); // ✅ encrypted storage
  }
  return { access_token, user };
}

// ── Login existing user ───────────────────────────────────────
export async function loginUser(email, password) {
  const response = await api.post(ENDPOINTS.login, {
    username: email,
    password,
  });
  const { access_token, user } = response.data;
  if (access_token) {
    await saveTokenSecure(access_token); // ✅ encrypted storage
  }
  return { access_token, user };
}

// ── Google OAuth login ────────────────────────────────────────
export async function googleLogin(googleAccessToken) {
  const response = await api.post(ENDPOINTS.googleAuth, {
    token: googleAccessToken,
  });
  const { access_token, user } = response.data;
  if (access_token) {
    await saveTokenSecure(access_token); // ✅ encrypted storage
  }
  return { access_token, user };
}

// ── Logout: clear all stored session data ─────────────────────
export async function logoutUser() {
  await clearTokenSecure(); // clears from SecureStore + AsyncStorage fallback
  await AsyncStorage.multiRemove([ONBOARDED_KEY, PROFILE_KEY]).catch(() => {});
}

// ── Token helpers ─────────────────────────────────────────────
export async function getStoredToken() {
  return await getTokenSecure(); // ✅ reads from secure storage
}

export async function hasValidToken() {
  return await hasTokenSecure(); // ✅ checks secure storage
}

// ── Onboarding flag ───────────────────────────────────────────
export async function setOnboarded() {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

export async function getIsOnboarded() {
  const val = await AsyncStorage.getItem(ONBOARDED_KEY);
  return val === 'true';
}

// ── Profile cache (non-sensitive, AsyncStorage is fine) ───────
export async function saveProfileCache(data) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export async function getProfileCache() {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearProfileCache() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
