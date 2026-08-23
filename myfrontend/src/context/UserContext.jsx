import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(null);
  const [dark, setDark] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // New state for Onboarding & Dashboard data
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
    recent_weight_logs: []
  });

  // ── Fetch real profile data from Django backend ──
  const loadUserProfile = async () => {
    const rawToken = localStorage.getItem('access_token');
    const token = rawToken ? rawToken.replace(/['\"]+/g, '') : null;
    if (!token) return;

    setProfileLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profile = res.data.data;

      // Seed userMetrics with real backend data
      setUserMetrics(prev => ({
        ...prev,
        daily_calorie_goal: profile.daily_calorie_target || prev.daily_calorie_goal,
        water_goal: parseFloat(profile.water_intake_litres) || prev.water_goal,
        current_weight: parseFloat(profile.current_weight_kg) || prev.current_weight,
        target_weight: parseFloat(profile.targeted_weight_kg) || prev.target_weight,
        goal_type: profile.primary_goal || prev.goal_type,
      }));

      // Store selected plan or plan_tier
      const rawPlan = profile.selected_plan || profile.plan_type || 'Free';
      const planStr = String(rawPlan).toLowerCase();
      let derivedTier = 'free';
      if (planStr.includes('premium') || planStr.includes('gym') || planStr.includes('athlete') || planStr.includes('vip')) derivedTier = 'premium';
      else if (planStr.includes('pro') || planStr.includes('student') || planStr.includes('working professional') || planStr.includes('standard')) derivedTier = 'pro';

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

      setUserData(prev => ({
        ...prev,
        ...profile,
        name: fullName || prev?.name,
        mainGoal: profile.primary_goal || prev?.mainGoal,
        plan_tier: derivedTier
      }));

      console.log('✅ Profile loaded from backend:', profile);

      return profile;
    } catch (err) {
      console.warn('⚠️ Could not load profile from backend:', err?.response?.data || err.message);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  const updateUserData = (data) => setUserData(prev => ({ ...prev, ...data }));

  // Called once when onboarding completes — seeds dashboard with real user data
  const saveOnboardingData = (data) => {
    setUserData(data);
    setUserMetrics(prev => ({
      ...prev,
      current_weight: parseFloat(data.weight) || prev.current_weight,
      target_weight: parseFloat(data.targetWeight) || prev.target_weight,
      daily_calorie_goal: data.calorieTarget || prev.daily_calorie_goal,
      water_goal: parseFloat(data.waterGoal) || prev.water_goal,
    }));
  };


  const updateWaterIntake = (amount) => {
    const rawToken = localStorage.getItem('access_token');
    const token = rawToken ? rawToken.replace(/['\"]+/g, '') : null;
    
    setDailyLogs(prev => {
      const newWater = Math.min(parseFloat((prev.current_water + amount).toFixed(2)), userMetrics.water_goal);
      if (token) {
        axios.post(`${BASE_URL}/api/dashboard/water/`, { water: newWater }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.warn("Failed to sync water intake with backend:", err.message));
      }
      return {
        ...prev,
        current_water: newWater
      };
    });
  };

  const addMealLog = (meal) => {
    setDailyLogs(prev => {
      const newCount = prev.junk_count + 1;
      return {
        ...prev,
        daily_calories_consumed: prev.daily_calories_consumed + (meal.calories || 0),
        daily_protein: prev.daily_protein + (meal.protein || 0),
        daily_carbs: prev.daily_carbs + (meal.carbs || 0),
        daily_fat: prev.daily_fat + (meal.fat || 0),
        junk_score: parseFloat(((prev.junk_score * prev.junk_count + (meal.junkScore || 0)) / newCount).toFixed(1)),
        junk_count: newCount,
      };
    });
  };

  return (
    <UserContext.Provider value={{
      userData, setUserData, updateUserData, saveOnboardingData,
      dark, setDark,
      userMetrics, setUserMetrics,
      dailyLogs, setDailyLogs,
      updateWaterIntake, addMealLog,
      loadUserProfile, profileLoading,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
