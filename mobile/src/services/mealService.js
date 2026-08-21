// FILE: mobile/src/services/mealService.js
// Purpose: Meal log CRUD (Get, Create, Delete) and AI image analysis (Gemini backend)
// Replaces: web's MealLogs.jsx axios calls
// Mobile-specific: uses expo-image-picker URI -> FormData multipart upload

import { Platform } from 'react-native';
import api, { uploadFormData } from './api';
import { ENDPOINTS } from '../constants/apiConfig';

// ── Get meal logs for current day ─────────────────────────────
export async function getMealLogs(date) {
  const params = date ? { date } : {};
  const response = await api.get(ENDPOINTS.mealLogs, { params });
  return response.data;
}

// ── Manually log a meal ───────────────────────────────────────
export async function createMealLog(mealData) {
  // mealData: { food_name, calories, protein, carbs, fat, meal_type, junk_score }
  const response = await api.post(ENDPOINTS.mealLogs, mealData);
  return response.data;
}

// ── Delete a logged meal ──────────────────────────────────────
export async function deleteMealLog(mealId) {
  if (!mealId) return true;
  const endpoint = ENDPOINTS.mealLogsDetail ? ENDPOINTS.mealLogsDetail(mealId) : `${ENDPOINTS.mealLogs}${mealId}/`;
  const response = await api.delete(endpoint);
  return response.data;
}

// ── Analyze food image via AI (Gemini) ───────────────────────
// imageUri: local file URI from expo-image-picker (e.g. file:///...)
// portionHint: optional user-provided context e.g. "2 pieces", "250g", "half plate"
export async function analyzeMealImage(imageUri, imageName = 'meal.jpg', mimeType = 'image/jpeg', portionHint = '') {
  const formData = new FormData();

  const filename = imageUri ? imageUri.split('/').pop() || imageName : imageName;
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const cleanUri = Platform.OS === 'android' ? imageUri : (imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`);

  formData.append('image', {
    uri: cleanUri,
    name: filename.includes('.') ? filename : `${filename}.${ext}`,
    type: type,
  });

  // Pass optional portion context to backend for improved AI accuracy (no scan limit cost)
  if (portionHint && portionHint.trim()) {
    formData.append('portion_hint', portionHint.trim());
  }

  const response = await uploadFormData(ENDPOINTS.mealAnalyze, formData);
  return response.data;
}

// ── Update water intake ───────────────────────────────────────
export async function updateWater(amount) {
  const response = await api.post(ENDPOINTS.dashboardWater, { water: amount });
  return response.data;
}

// ── Get dashboard summary ─────────────────────────────────────
export async function getDashboardData() {
  const response = await api.get(ENDPOINTS.dashboard);
  return response.data;
}
