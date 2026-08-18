// FILE: mobile/src/context/AuthContext.js
// Purpose: Global auth state — user, profile, metrics, daily logs
// Security fixes:
//   - signOut() now calls logoutUser() to clear SecureStore token
//   - hooks into api.js 401 unauthorized callback for auto-logout on token expiry

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { fetchProfile } from '../services/profileService';
import { saveProfileCache, setOnboarded, getIsOnboarded, logoutUser } from '../services/authService';
import { updateWater } from '../services/mealService';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboarded, setIsOnboardedState] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const [userMetrics, setUserMetrics] = useState({
    current_weight: 0,
    target_weight: 0,
    goal_type: 'loss',
    daily_calorie_goal: 1920,
    water_goal: 3.0,
  });

  const [dailyLogs, setDailyLogs] = useState({
    current_water: 0,
    daily_calories_consumed: 0,
    daily_protein: 0,
    daily_carbs: 0,
    daily_fat: 0,
    junk_score: 0,
    junk_count: 0,
    recent_weight_logs: [],
  });

  // ── Helper to update userData and sync to AsyncStorage profile cache ────
  const updateUserData = useCallback(async (updates) => {
    setUserData((prev) => {
      const next = { ...(prev || {}), ...updates };
      saveProfileCache(next).catch((e) => console.warn('Could not save profile cache:', e));
      return next;
    });
  }, []);

  // ── Load profile from backend and hydrate state ───────────────
  const loadUserProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const profile = await fetchProfile();
      setUserData((prev) => ({ ...prev, ...profile }));

      setUserMetrics((prev) => ({
        ...prev,
        daily_calorie_goal: profile.calorieTarget || prev.daily_calorie_goal,
        water_goal: parseFloat(profile.waterGoal) || prev.water_goal,
        current_weight: parseFloat(profile.weight) || prev.current_weight,
        target_weight: parseFloat(profile.targetWeight) || prev.target_weight,
        goal_type: profile.mainGoal || prev.goal_type,
      }));

      await saveProfileCache(profile);
      return profile;
    } catch (err) {
      console.warn('⚠️ Could not load profile:', err?.message);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ── Called after onboarding completes ────────────────────────
  const saveOnboardingData = useCallback(async (data) => {
    setUserData(data);
    setUserMetrics((prev) => ({
      ...prev,
      current_weight: parseFloat(data.weight) || prev.current_weight,
      target_weight: parseFloat(data.targetWeight) || prev.target_weight,
      daily_calorie_goal: data.calorieTarget || prev.daily_calorie_goal,
      water_goal: parseFloat(data.waterGoal) || prev.water_goal,
    }));
    setDailyLogs((prev) => ({ ...prev, current_water: 0 }));
    await saveProfileCache(data);
  }, []);

  // ── Water intake updater (syncs to backend) ───────────────────
  const updateWaterIntake = useCallback(
    async (amount) => {
      setDailyLogs((prev) => {
        const newWater = Math.min(
          parseFloat((prev.current_water + amount).toFixed(2)),
          userMetrics.water_goal
        );
        updateWater(newWater).catch((e) => console.warn('Water sync failed:', e.message));
        return { ...prev, current_water: newWater };
      });
    },
    [userMetrics.water_goal]
  );

  // ── Add logged meal to today's totals ────────────────────────
  const addMealLog = useCallback((meal) => {
    setDailyLogs((prev) => {
      const newCount = prev.junk_count + 1;
      return {
        ...prev,
        daily_calories_consumed: prev.daily_calories_consumed + (meal.calories || 0),
        daily_protein: prev.daily_protein + (meal.protein || 0),
        daily_carbs: prev.daily_carbs + (meal.carbs || 0),
        daily_fat: prev.daily_fat + (meal.fat || 0),
        junk_score: parseFloat(
          ((prev.junk_score * prev.junk_count + (meal.junkScore || 0)) / newCount).toFixed(1)
        ),
        junk_count: newCount,
      };
    });
  }, []);

  // ── Remove logged meal from today's totals ─────────────────────
  const removeMealLog = useCallback((meal) => {
    setDailyLogs((prev) => {
      const newCount = Math.max(prev.junk_count - 1, 0);
      const newCal = Math.max(prev.daily_calories_consumed - (meal.calories || 0), 0);
      const newP = Math.max(prev.daily_protein - (parseFloat(meal.protein_gm || meal.protein) || 0), 0);
      const newC = Math.max(prev.daily_carbs - (parseFloat(meal.carbs_gm || meal.carbs) || 0), 0);
      const newF = Math.max(prev.daily_fat - (parseFloat(meal.fat_gm || meal.fat) || 0), 0);
      const newJunk = newCount > 0
        ? parseFloat(Math.max((prev.junk_score * prev.junk_count - (meal.junk_score || meal.junkScore || 0)) / newCount, 0).toFixed(1))
        : 0;

      return {
        ...prev,
        daily_calories_consumed: newCal,
        daily_protein: newP,
        daily_carbs: newC,
        daily_fat: newF,
        junk_score: newJunk,
        junk_count: newCount,
      };
    });
  }, []);

  // ── Set auth state after login ────────────────────────────────
  const signIn = useCallback(async (onboarded = false) => {
    setIsAuthenticated(true);
    setIsOnboardedState(onboarded);
    if (onboarded) {
      await setOnboarded();
    }
  }, []);

  // ── Clear all state after logout ──────────────────────────────
  // FIX: now calls logoutUser() to clear SecureStore token (was missing before)
  const signOut = useCallback(async () => {
    try {
      await logoutUser(); // ✅ clears JWT from SecureStore + AsyncStorage
    } catch (e) {
      console.warn('Logout cleanup error:', e.message);
    }
    setIsAuthenticated(false);
    setIsOnboardedState(false);
    setUserData(null);
    setUserMetrics({
      current_weight: 0,
      target_weight: 0,
      goal_type: 'loss',
      daily_calorie_goal: 1920,
      water_goal: 3.0,
    });
    setDailyLogs({
      current_water: 0,
      daily_calories_consumed: 0,
      daily_protein: 0,
      daily_carbs: 0,
      daily_fat: 0,
      junk_score: 0,
      junk_count: 0,
      recent_weight_logs: [],
    });
  }, []);

  const completeOnboarding = useCallback(async (data) => {
    await saveOnboardingData(data);
    await setOnboarded();
    setIsOnboardedState(true);
  }, [saveOnboardingData]);

  // ── Hook into api.js 401 handler for auto-logout on token expiry ──
  // FIX: when the backend returns 401 (expired/invalid token), automatically sign out
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        // Auth
        isAuthenticated,
        isOnboarded,
        appReady,
        setAppReady,
        signIn,
        signOut,
        completeOnboarding,
        // Profile
        userData,
        setUserData,
        updateUserData,
        profileLoading,
        loadUserProfile,
        saveOnboardingData,
        // Metrics & Logs
        userMetrics,
        setUserMetrics,
        dailyLogs,
        setDailyLogs,
        updateWaterIntake,
        addMealLog,
        removeMealLog,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
