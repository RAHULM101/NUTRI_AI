// FILE: mobile/src/services/api.js
// Purpose: Axios instance with JWT bearer token injection, 401 auto-logout, and centralized error handling
// Security: Reads token from encrypted SecureStore, handles expired tokens automatically

import axios from 'axios';
import { API_URL } from '../constants/apiConfig';
import { getTokenSecure, clearTokenSecure } from './secureStorage';

// ── Unauthorized callback (set by AuthContext on mount) ───────
// This avoids a circular dependency between api.js and AuthContext
let _onUnauthorized = null;
export function setUnauthorizedHandler(callback) {
  _onUnauthorized = callback;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s to tolerate Render free-tier cold starts
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ── Request Interceptor: inject JWT from SecureStore ──────────
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getTokenSecure();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // If SecureStore fails, proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthEndpoint =
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/auth/google');

    // ── 401 Unauthorized Handling ─────────────────────────────
    if (status === 401) {
      if (isAuthEndpoint) {
        // Fresh login/register attempt failed (e.g. wrong password or Google account)
        // Surface the backend's exact message without clearing session or auto-logging out
        const authMessage =
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          'Invalid credentials. Please check your email and password.';
        error.normalizedMessage = authMessage;
        error.statusCode = 401;
        return Promise.reject(error);
      }

      // Real authenticated session expired or revoked
      await clearTokenSecure().catch(() => {});
      if (_onUnauthorized) {
        _onUnauthorized();
      }
      error.normalizedMessage = 'Your session has expired. Please log in again.';
      error.statusCode = 401;
      return Promise.reject(error);
    }

    let message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong';

    if (error?.message === 'Network Error') {
      message = `Cannot reach server. Please check your internet connection.`;
    }

    if (status === 429) {
      message = 'Too many requests. Please slow down and try again in a moment.';
    }

    if (status === 502 || status === 503 || status === 504) {
      message = 'Backend server is temporarily unreachable. Please check if your Django server is running.';
    }

    if (status === 500) {
      message = 'Server error. Please try again later.';
    }

    // Attach clean error info for consumers
    error.normalizedMessage = message;
    error.statusCode = status;

    return Promise.reject(error);
  }
);

export default api;

export async function uploadFormData(endpoint, formData) {
  const token = await getTokenSecure();

  try {
    const response = await axios.post(`${API_URL}${endpoint}`, formData, {
      headers: {
        'Accept': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
        'bypass-tunnel-reminder': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      transformRequest: (data) => data, // Preserve native React Native FormData instance
      timeout: 60000, // 60s for AI image analysis
    });
    return response;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401) {
      await clearTokenSecure().catch(() => {});
      if (_onUnauthorized) {
        _onUnauthorized();
      }
      error.normalizedMessage = 'Your session has expired. Please log in again.';
      error.statusCode = 401;
    }
    throw error;
  }
}
