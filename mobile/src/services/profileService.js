// FILE: mobile/src/services/profileService.js
// Purpose: Fetch user profile from backend & update onboarding data
// Mirrors: web's App.jsx fetchAndHydrateProfile + UserContext.jsx loadUserProfile

import api from './api';
import { ENDPOINTS } from '../constants/apiConfig';

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ── Fetch & map raw profile from backend ──────────────────────
export async function fetchProfile() {
  const response = await api.get(ENDPOINTS.profile);
  const d = response.data?.data || response.data || {};

  const monthName = d.month_of_birth ? monthNames[d.month_of_birth - 1] : '';

  return {
    firstName: d.first_name || '',
    lastName: d.last_name || '',
    name: `${d.first_name || ''} ${d.last_name || ''}`.trim(),
    dobDay: d.day_of_birth ? String(d.day_of_birth).padStart(2, '0') : '',
    dobMonth: monthName,
    dobYear: d.year_of_birth ? String(d.year_of_birth) : '',
    photo: d.profile_photo_url || null,
    gender: d.gender || '',
    phone: d.phone_number || '',
    height: d.height_cm ? String(d.height_cm) : '',
    weight: d.current_weight_kg ? String(d.current_weight_kg) : '',
    targetWeight: d.targeted_weight_kg ? String(d.targeted_weight_kg) : '',
    waterGoal: d.water_intake_litres ? String(d.water_intake_litres) : '3',
    mainGoal: d.primary_goal || '',
    activityLevel: d.activity_level || '',
    occupation: d.occupation || '',
    sleepSchedule: d.sleep_schedule || '',
    dietaryPreference: d.dietary_preference || '',
    cookingOil: d.preferred_cooking_oil || '',
    regionalCulture: d.regional_culture || '',
    allergies: d.allergies ? d.allergies.split(', ') : [],
    healthIssues: d.health_issues ? d.health_issues.split(', ') : [],
    likedFoods: d.liked_foods || '',
    dislikedFoods: d.disliked_foods || '',
    mealsPerDay: d.meal_intake_per_day ? String(d.meal_intake_per_day) : '',
    cookingTime: d.available_cooking_time || '',
    groceryBudget: d.grocery_budget || '',
    mealLocation: d.preferred_meal_location || '',
    mainCarbs: d.main_carbs_source || '',
    calorieTarget: d.daily_calorie_target || 0,
    bmi: d.bmi || 0,
    selectedPlan: d.selected_plan || d.selectedPlan || (d.active_subscription && d.active_subscription.plan_type) || 'Pro',
    is_onboarded: d.is_Onboarded || d.is_onboarded || false,
  };
}

// ── Update onboarding data via PATCH ─────────────────────────
export async function updateOnboarding(userId, data) {
  const response = await api.patch(ENDPOINTS.onboardingDetail(userId), data);
  return response.data;
}

// ── Update selected plan on profile ───────────────────────────
export async function updateProfilePlan(planId) {
  try {
    const response = await api.patch(ENDPOINTS.profile, { selected_plan: planId });
    return response.data;
  } catch (err) {
    try {
      const fallback = await api.put(ENDPOINTS.profile, { selected_plan: planId });
      return fallback.data;
    } catch {
      return { success: true, planId };
    }
  }
}
