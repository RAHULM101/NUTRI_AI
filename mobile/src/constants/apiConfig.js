// FILE: mobile/src/constants/apiConfig.js
// Purpose: Central definition of API base URL and all endpoints
// Reads from EXPO_PUBLIC_API_URL env variable — never hardcoded

const BASE_URL = 'https://nutri-ai-b2wx.onrender.com';

export const API_URL = BASE_URL;

export const ENDPOINTS = {
  // Auth
  register: '/api/register/',
  login: '/api/login/',
  googleAuth: '/api/auth/google/',

  // Profile & Onboarding
  profile: '/api/profile/',
  onboarding: '/api/onboarding/',
  onboardingDetail: (id) => `/api/onboarding/${id}/`,

  // Dashboard
  dashboard: '/api/dashboard/',
  dashboardWater: '/api/dashboard/water/',

  // Meal Logs
  mealLogs: '/api/meal-logs/',
  mealAnalyze: '/api/meal-logs/analyze/',
  mealAutoFix: '/api/meal-logs/auto-fix/',
  mealLogsDetail: (id) => `/api/meal-logs/${id}/`,

  // Nia AI
  niaChat: '/api/nia/chat/',

  // Store
  storeProducts: '/api/store/products/',
  storeProductDetail: (id) => `/api/store/products/${id}/`,
  storeCart: '/api/store/cart/',
  storeCartAdd: '/api/store/cart/add/',
  storeCartUpdate: (id) => `/api/store/cart/update/${id}/`,
  storeCheckout: '/api/store/checkout/',
  storeOrders: '/api/store/orders/',
};
