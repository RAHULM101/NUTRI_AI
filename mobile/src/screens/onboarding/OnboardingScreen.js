// FILE: mobile/src/screens/onboarding/OnboardingScreen.js
// Purpose: Multi-step onboarding wizard (8 steps) with Plan Selection, Skip button, custom allergy input, micro-animations, and theme support
// Converted from: web's Onboarding.jsx

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronLeft, Check, X, Plus, User, Star, Flame, Activity, Trophy } from 'lucide-react-native';
import Button from '../../components/common/Button';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getStoredToken, logoutUser } from '../../services/authService';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/apiConfig';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const TOTAL_STEPS = 8;

const GOALS = ['Fat Loss', 'Muscle Gain', 'Weight Gain', 'Maintain Weight', 'Athletic Performance', 'General Fitness'];
const ACTIVITY_LEVELS = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'];
const DIETARY_PREFS = ['Non-Vegetarian', 'Vegetarian', 'Vegan', 'Eggetarian', 'Jain', 'Keto', 'Gluten-Free', 'No Restriction'];
const COOKING_OILS = ['Mustard Oil', 'Sunflower Oil', 'Coconut Oil', 'Olive Oil', 'Ghee', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const ALLERGIES_LIST = ['None', 'Gluten', 'Dairy', 'Nuts', 'Shellfish', 'Eggs', 'Soy', 'Fish'];
const HEALTH_ISSUES_LIST = ['None', 'Diabetes', 'Hypertension', 'High Cholesterol', 'PCOS/PCOD', 'Thyroid'];
const COOKING_TIMES = ['Under 20 min', '20-40 min', '40-60 min', 'Over 60 min'];
const MEAL_LOCATIONS = ['Home', 'Office/School', 'Mix of both'];
const BUDGET_OPTIONS = ['Under ₹200/day', '₹200-400/day', '₹400-600/day', '₹600+/day'];
const CARBS_OPTIONS = ['Rice', 'Wheat/Roti', 'Mix of both', 'Millets', 'Other'];
const REGIONS = ['North Indian', 'South Indian', 'Bengali', 'Maharashtrian', 'Gujarati', 'Global/Mixed'];

const PLANS = [
  {
    id: 'Free',
    tag: 'FREE',
    title: 'Free Plan',
    price: '0',
    subtitle: 'Always free, no card needed',
    free: true,
    recommended: false,
    features: ['3 Meal Scans / day', 'Basic Access'],
  },
  {
    id: 'Pro',
    tag: 'PRO',
    title: 'Pro Plan',
    price: '149',
    subtitle: 'Best for serious health goals',
    free: false,
    recommended: true,
    features: ['10 Meal Scans / day', 'Limited Nia AI Access', '7 Days Meal History', 'PDF Report Export'],
  },
  {
    id: 'Premium',
    tag: 'PREMIUM',
    title: 'Premium Plan',
    price: '499',
    subtitle: 'Everything, no limits',
    free: false,
    recommended: false,
    features: ['20 Meal Scans / day', 'Unlimited Nia AI', '30 Days Meal History', 'weekly and monthly PDF Report Export', 'Smart Reminders'],
  },
];

const getBmiCategory = (bmi) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3B82F6' };
  if (bmi < 25) return { label: 'Healthy', color: COLORS.teal };
  if (bmi < 30) return { label: 'Overweight', color: '#F59E0B' };
  return { label: 'Obese', color: COLORS.error };
};

const buildForm = (d) => ({
  firstName: d?.firstName || '',
  lastName: d?.lastName || '',
  dobDay: d?.dobDay || '',
  dobMonth: d?.dobMonth || '',
  dobYear: d?.dobYear || '',
  gender: d?.gender || '',
  phone: d?.phone || '',
  height: d?.height || '',
  weight: d?.weight || '',
  targetWeight: d?.targetWeight || '',
  waterGoal: d?.waterGoal ? String(d.waterGoal) : '3',
  mainGoal: d?.mainGoal || '',
  activityLevel: d?.activityLevel || '',
  occupation: d?.occupation || '',
  sleepSchedule: d?.sleepSchedule || '',
  dietaryPreference: d?.dietaryPreference || '',
  cookingOil: d?.cookingOil || '',
  regionalCulture: d?.regionalCulture || '',
  allergies: Array.isArray(d?.allergies) ? d.allergies : [],
  healthIssues: Array.isArray(d?.healthIssues) ? d.healthIssues : [],
  likedFoods: d?.likedFoods || '',
  dislikedFoods: d?.dislikedFoods || '',
  customAllergy: '',
  customHealthIssue: '',
  mealsPerDay: d?.mealsPerDay || '',
  cookingTime: d?.cookingTime || '',
  groceryBudget: d?.groceryBudget || '',
  mealLocation: d?.mealLocation || '',
  mainCarbs: d?.mainCarbs || '',
  calorieTarget: d?.calorieTarget || 0,
  bmi: d?.bmi || 0,
  selectedPlan: d?.selectedPlan || 'Pro',
});

function ChipButton({ label, active, onPress, colors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.chip,
          { backgroundColor: colors.bgCard, borderColor: colors.border },
          active && { borderColor: COLORS.teal, backgroundColor: 'rgba(20,184,166,0.12)' },
        ]}
      >
        {active && <Check size={14} color={COLORS.teal} strokeWidth={3} />}
        <Text style={[styles.chipText, { color: colors.textSecondary }, active && { color: COLORS.teal, fontWeight: '800' }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function OptionButton({ label, active, onPress, colors }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionBtn,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        active && { borderColor: COLORS.primary, backgroundColor: 'rgba(16,185,129,0.08)' },
      ]}
    >
      <Text style={[styles.optionBtnText, { color: colors.textSecondary }, active && { color: COLORS.primary, fontWeight: '800' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, keyboardType = 'default', style, colors }) {
  return (
    <View style={[inputStyles.wrapper, style]}>
      {label && <Text style={[inputStyles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        style={[inputStyles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    fontSize: 16,
    height: 52,
  },
});

export default function OnboardingScreen({ navigation, route }) {
  const { userData, completeOnboarding, loadUserProfile, signIn } = useAuth();
  const { isDark, colors } = useTheme();
  const initialData = route?.params?.initialData || userData || null;
  const fromProfile = route?.params?.isEditMode || route?.params?.fromProfile || false;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => buildForm(initialData));
  const [photoUri, setPhotoUri] = useState(initialData?.photo || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step transition animation
  const stepSlide = useRef(new Animated.Value(0)).current;

  // Pre-fill formData if userData arrives or changes
  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...buildForm(userData),
        ...prev,
        firstName: prev.firstName || userData.firstName || '',
        lastName: prev.lastName || userData.lastName || '',
        gender: prev.gender || userData.gender || '',
        phone: prev.phone || userData.phone || '',
        dobDay: prev.dobDay || userData.dobDay || '',
        dobMonth: prev.dobMonth || userData.dobMonth || '',
        dobYear: prev.dobYear || userData.dobYear || '',
        height: prev.height || userData.height || '',
        weight: prev.weight || userData.weight || '',
        targetWeight: prev.targetWeight || userData.targetWeight || '',
        waterGoal: prev.waterGoal || userData.waterGoal || '3',
        mainGoal: prev.mainGoal || userData.mainGoal || '',
        activityLevel: prev.activityLevel || userData.activityLevel || '',
        dietaryPreference: prev.dietaryPreference || userData.dietaryPreference || '',
        allergies: (prev.allergies && prev.allergies.length > 0) ? prev.allergies : (userData.allergies || []),
        healthIssues: (prev.healthIssues && prev.healthIssues.length > 0) ? prev.healthIssues : (userData.healthIssues || []),
      }));
      if (!photoUri && userData.photo) {
        setPhotoUri(userData.photo);
      }
    }
  }, [userData]);

  const set = (name, value) => setFormData((prev) => ({ ...prev, [name]: value }));

  const toggleChip = (category, value) => {
    if (value === 'None') {
      setFormData((prev) => {
        const currentList = prev[category] || [];
        const isNoneActive = currentList.includes('None');
        return { ...prev, [category]: isNoneActive ? [] : ['None'] };
      });
      return;
    }
    setFormData((prev) => {
      const currentList = prev[category] || [];
      const filtered = currentList.filter((i) => i !== 'None');
      const exists = filtered.includes(value);
      const next = exists ? filtered.filter((i) => i !== value) : [...filtered, value];
      return { ...prev, [category]: next };
    });
  };

  const addCustomChip = (category, key) => {
    const val = formData[key]?.trim();
    if (val && !formData[category].includes(val)) {
      setFormData((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []).filter((i) => i !== 'None'), val],
        [key]: '',
      }));
    }
  };

  const animateStep = () => {
    stepSlide.setValue(30);
    Animated.spring(stepSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }).start();
  };

  const calculateResults = useCallback(() => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    if (!w || !h || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return { bmi: null, cal: null };
    }
    const age = formData.dobYear ? Math.max(10, new Date().getFullYear() - parseInt(formData.dobYear)) : 25;
    const bmi = parseFloat((w / (h / 100) ** 2).toFixed(1));
    let bmr = 10 * w + 6.25 * h - 5 * age + (formData.gender === 'Male' ? 5 : -161);
    const multipliers = { Sedentary: 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725 };
    let cal = Math.round(bmr * (multipliers[formData.activityLevel] || 1.3));
    if (formData.mainGoal === 'Fat Loss') cal -= 500;
    if (formData.mainGoal === 'Muscle Gain') cal += 300;
    if (formData.mainGoal === 'Weight Gain') cal += 500;
    return { bmi, cal: Math.max(cal, 1200) };
  }, [formData.weight, formData.height, formData.dobYear, formData.gender, formData.activityLevel, formData.mainGoal]);

  const handleNext = () => {
    if (step === 6) {
      const res = calculateResults();
      setFormData((prev) => ({ ...prev, bmi: res.bmi, calorieTarget: res.cal }));
      setStep(7);
      animateStep();
    } else if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      animateStep();
    }
  };

  const handleSkipStep = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      animateStep();
    }
  };

  const handleBack = async () => {
    if (step > 1) {
      setStep((s) => s - 1);
      animateStep();
    } else {
      if (fromProfile || navigation.canGoBack()) {
        navigation.goBack();
      } else {
        try {
          await logoutUser();
          await signIn(false);
        } catch (e) {
          if (navigation.canGoBack()) navigation.goBack();
        }
      }
    }
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // ── Universal Quick Save Handler for ANY Step ─────────────────
  const handleQuickSave = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const token = await getStoredToken();
      if (!token) throw new Error('No auth token');

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.id || payload.sub;

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthInt = formData.dobMonth ? monthNames.indexOf(formData.dobMonth) + 1 : null;

      const results = calculateResults();
      const finalBmi = results?.bmi || parseFloat(formData.bmi) || 22.5;
      const finalCal = results?.cal || parseInt(formData.calorieTarget) || 1920;

      const patchPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        day_of_birth: parseInt(formData.dobDay) || null,
        month_of_birth: monthInt,
        year_of_birth: parseInt(formData.dobYear) || null,
        phone_number: formData.phone,
        profile_photo_url: photoUri,
        gender: formData.gender,
        height_cm: parseFloat(formData.height) || null,
        current_weight_kg: parseFloat(formData.weight) || null,
        targeted_weight_kg: parseFloat(formData.targetWeight) || null,
        water_intake_litres: parseFloat(formData.waterGoal) || 3.0,
        primary_goal: formData.mainGoal,
        activity_level: formData.activityLevel,
        occupation: formData.occupation,
        sleep_schedule: formData.sleepSchedule,
        dietary_preference: formData.dietaryPreference,
        preferred_cooking_oil: formData.cookingOil,
        regional_culture: formData.regionalCulture,
        allergies: Array.isArray(formData.allergies) ? formData.allergies.join(', ') : '',
        health_issues: Array.isArray(formData.healthIssues) ? formData.healthIssues.join(', ') : '',
        liked_foods: formData.likedFoods,
        disliked_foods: formData.dislikedFoods,
        meal_intake_per_day: parseInt(formData.mealsPerDay) || 3,
        available_cooking_time: formData.cookingTime,
        grocery_budget: formData.groceryBudget,
        preferred_meal_location: formData.mealLocation,
        main_carbs_source: formData.mainCarbs,
        bmi: finalBmi,
        daily_calorie_target: finalCal,
        is_onboarded: true,
        selected_plan: formData.selectedPlan || 'Pro',
      };

      // FIX Bug #3: Run both PATCHes in parallel — faster than sequential await
      await Promise.all([
        api.patch(ENDPOINTS.profile, patchPayload).catch(() => {}),
        userId ? api.patch(ENDPOINTS.onboardingDetail(userId), patchPayload).catch(() => {}) : Promise.resolve(),
      ]);

      const completeData = {
        ...formData,
        selectedPlan: formData.selectedPlan || 'Pro',
        photo: photoUri,
        bmi: finalBmi,
        calorieTarget: finalCal,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        is_onboarded: true,
      };

      await completeOnboarding(completeData);
      await loadUserProfile().catch(() => {});

      Alert.alert('Saved! 🎯', 'Your profile details and calorie targets have been saved successfully.');
      if (fromProfile || navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('Main');
      }
    } catch (err) {
      console.error('Save error:', err?.response?.data || err.message);
      setErrorMsg('Could not save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const token = await getStoredToken();
      if (!token) throw new Error('No auth token');

      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.user_id || payload.id || payload.sub;

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthInt = formData.dobMonth ? monthNames.indexOf(formData.dobMonth) + 1 : null;

      const results = calculateResults();
      const finalBmi = results?.bmi || parseFloat(formData.bmi) || 22.5;
      const finalCal = results?.cal || parseInt(formData.calorieTarget) || 1920;

      const finalPayload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        day_of_birth: parseInt(formData.dobDay) || null,
        month_of_birth: monthInt,
        year_of_birth: parseInt(formData.dobYear) || null,
        phone_number: formData.phone,
        profile_photo_url: photoUri,
        gender: formData.gender,
        height_cm: parseFloat(formData.height) || null,
        current_weight_kg: parseFloat(formData.weight) || null,
        targeted_weight_kg: parseFloat(formData.targetWeight) || null,
        water_intake_litres: parseFloat(formData.waterGoal) || 3.0,
        primary_goal: formData.mainGoal,
        activity_level: formData.activityLevel,
        occupation: formData.occupation,
        sleep_schedule: formData.sleepSchedule,
        dietary_preference: formData.dietaryPreference,
        preferred_cooking_oil: formData.cookingOil,
        regional_culture: formData.regionalCulture,
        allergies: Array.isArray(formData.allergies) ? formData.allergies.join(', ') : '',
        health_issues: Array.isArray(formData.healthIssues) ? formData.healthIssues.join(', ') : '',
        liked_foods: formData.likedFoods,
        disliked_foods: formData.dislikedFoods,
        meal_intake_per_day: parseInt(formData.mealsPerDay) || 3,
        available_cooking_time: formData.cookingTime,
        grocery_budget: formData.groceryBudget,
        preferred_meal_location: formData.mealLocation,
        main_carbs_source: formData.mainCarbs,
        bmi: finalBmi,
        daily_calorie_target: finalCal,
        is_onboarded: true,
        selected_plan: formData.selectedPlan || 'Pro',
      };

      // FIX Bug #3: Run both PATCHes in parallel — cuts network wait time in half
      await Promise.all([
        api.patch(ENDPOINTS.profile, finalPayload).catch(() => {}),
        userId ? api.patch(ENDPOINTS.onboardingDetail(userId), finalPayload).catch(() => {}) : Promise.resolve(),
      ]);

      const completeData = {
        ...formData,
        selectedPlan: formData.selectedPlan || 'Pro',
        photo: photoUri,
        bmi: finalBmi,
        calorieTarget: finalCal,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        is_onboarded: true,
      };

      // FIX Bug #4: Navigate to Success BEFORE calling completeOnboarding().
      // completeOnboarding() sets isOnboarded=true which causes RootNavigator to
      // remount the navigation tree. If we navigate after, the navigation ref is
      // stale and the replace() call fails, causing the 'kicked out' glitch.
      // Both stacks (onboarded + not-onboarded) include 'Success', so this is safe.
      navigation.replace('Success');

      // Now set onboarding complete and refresh profile in background
      await completeOnboarding(completeData);
      loadUserProfile().catch(() => {});
    } catch (err) {
      console.error('Onboarding error:', err?.response?.data || err.message);
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const bmiInfo = formData.bmi ? getBmiCategory(formData.bmi) : null;
  const progress = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Personal Info</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>Tell us about yourself to get started</Text>

            <View style={styles.photoSection}>
              <Pressable style={styles.photoPick} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImg} />
                ) : (
                  <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border }]}>
                    <User size={36} color={isDark ? '#94A3B8' : '#64748B'} />
                  </View>
                )}
                <View style={styles.photoEditBadge}>
                  <Camera size={14} color="#fff" />
                </View>
              </Pressable>
              <Text style={[styles.photoHint, { color: colors.textMuted }]}>Add profile photo</Text>
            </View>

            <FieldInput label="First Name *" value={formData.firstName} onChangeText={(v) => set('firstName', v)} placeholder="e.g. Rahul" colors={colors} />
            <FieldInput label="Last Name" value={formData.lastName} onChangeText={(v) => set('lastName', v)} placeholder="e.g. Sharma" colors={colors} />
            <FieldInput label="Phone Number" value={formData.phone} onChangeText={(v) => set('phone', v)} placeholder="+91 XXXXXXXXXX" keyboardType="phone-pad" colors={colors} />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
            <View style={styles.dobRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.dobBox,
                    {
                      borderColor: formData.dobDay ? COLORS.primary : colors.border,
                      backgroundColor: colors.bgCard,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.dobInput,
                      styles.dobInputShort,
                      { color: colors.text },
                    ]}
                    value={formData.dobDay}
                    onChangeText={(v) => set('dobDay', v)}
                    placeholder="DD"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    textAlignVertical="center"
                    includeFontPadding={false}
                    cursorColor={COLORS.primary}
                    selectionColor={isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
              <View style={{ flex: 1.2, marginHorizontal: SPACING.sm }}>
                <View
                  style={[
                    styles.dobBox,
                    {
                      borderColor: formData.dobMonth ? COLORS.primary : colors.border,
                      backgroundColor: colors.bgCard,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.dobInput,
                      styles.dobInputShort,
                      { color: colors.text },
                    ]}
                    value={formData.dobMonth}
                    onChangeText={(v) => set('dobMonth', v)}
                    placeholder="MM"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                    textAlignVertical="center"
                    includeFontPadding={false}
                    cursorColor={COLORS.primary}
                    selectionColor={isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
              <View style={{ flex: 1.5 }}>
                <View
                  style={[
                    styles.dobBox,
                    {
                      borderColor: formData.dobYear ? COLORS.primary : colors.border,
                      backgroundColor: colors.bgCard,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.dobInput,
                      styles.dobInputLong,
                      { color: colors.text },
                    ]}
                    value={formData.dobYear}
                    onChangeText={(v) => set('dobYear', v)}
                    placeholder="YYYY"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                    textAlignVertical="center"
                    includeFontPadding={false}
                    cursorColor={COLORS.primary}
                    selectionColor={isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => <ChipButton key={g} label={g} active={formData.gender === g} onPress={() => set('gender', g)} colors={colors} />)}
            </View>
          </View>
        );

      case 2:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Body Metrics</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>Used to calculate your metabolic rate and targets</Text>
            <View style={styles.row2}>
              <FieldInput label="Height (cm) *" value={formData.height} onChangeText={(v) => set('height', v)} placeholder="e.g. 170" keyboardType="numeric" style={{ flex: 1, marginRight: SPACING.sm }} colors={colors} />
              <FieldInput label="Current Weight (kg) *" value={formData.weight} onChangeText={(v) => set('weight', v)} placeholder="e.g. 72" keyboardType="numeric" style={{ flex: 1 }} colors={colors} />
            </View>
            <FieldInput label="Target Weight (kg) *" value={formData.targetWeight} onChangeText={(v) => set('targetWeight', v)} placeholder="e.g. 65" keyboardType="numeric" colors={colors} />
            <FieldInput label="Daily Water Goal (L) *" value={formData.waterGoal} onChangeText={(v) => set('waterGoal', v)} placeholder="e.g. 3" keyboardType="decimal-pad" colors={colors} />
          </View>
        );

      case 3:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Your Goal & Lifestyle</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>What are you primarily looking to achieve?</Text>
            {GOALS.map((g) => <OptionButton key={g} label={g} active={formData.mainGoal === g} onPress={() => set('mainGoal', g)} colors={colors} />)}

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: SPACING.lg }]}>Activity Level</Text>
            {ACTIVITY_LEVELS.map((a) => <OptionButton key={a} label={a} active={formData.activityLevel === a} onPress={() => set('activityLevel', a)} colors={colors} />)}
          </View>
        );

      case 4:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Dietary Preferences</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>Help Nia personalize your meal recommendations</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Dietary Preference</Text>
            <View style={styles.chipRow}>
              {DIETARY_PREFS.map((d) => <ChipButton key={d} label={d} active={formData.dietaryPreference === d} onPress={() => set('dietaryPreference', d)} colors={colors} />)}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Preferred Cooking Oil</Text>
            <View style={styles.chipRow}>
              {COOKING_OILS.map((o) => <ChipButton key={o} label={o} active={formData.cookingOil === o} onPress={() => set('cookingOil', o)} colors={colors} />)}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Regional Cuisine</Text>
            <View style={styles.chipRow}>
              {REGIONS.map((r) => <ChipButton key={r} label={r} active={formData.regionalCulture === r} onPress={() => set('regionalCulture', r)} colors={colors} />)}
            </View>
          </View>
        );

      case 5:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Health & Allergies</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>Select any dietary restrictions or health conditions</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Allergies</Text>
            <View style={styles.chipRow}>
              {ALLERGIES_LIST.map((a) => <ChipButton key={a} label={a} active={formData.allergies.includes(a)} onPress={() => toggleChip('allergies', a)} colors={colors} />)}
            </View>
            <View style={styles.addChipRow}>
              <TextInput
                style={[styles.addChipInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={formData.customAllergy}
                onChangeText={(v) => set('customAllergy', v)}
                placeholder="Add allergy (e.g. Soy)"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addChipBtn} onPress={() => addCustomChip('allergies', 'customAllergy')}>
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: SPACING.md }]}>Health Conditions</Text>
            <View style={styles.chipRow}>
              {HEALTH_ISSUES_LIST.map((h) => <ChipButton key={h} label={h} active={formData.healthIssues.includes(h)} onPress={() => toggleChip('healthIssues', h)} colors={colors} />)}
            </View>
            <View style={styles.addChipRow}>
              <TextInput
                style={[styles.addChipInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                value={formData.customHealthIssue}
                onChangeText={(v) => set('customHealthIssue', v)}
                placeholder="Add condition (e.g. PCOS)"
                placeholderTextColor={colors.textMuted}
              />
              <Pressable style={styles.addChipBtn} onPress={() => addCustomChip('healthIssues', 'customHealthIssue')}>
                <Plus size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        );

      case 6:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Meal Routine</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>Customize your daily meal routine</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Meals Per Day</Text>
            <View style={styles.chipRow}>
              {['2', '3', '4', '5'].map((n) => <ChipButton key={n} label={`${n} Meals`} active={formData.mealsPerDay === n} onPress={() => set('mealsPerDay', n)} colors={colors} />)}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Cooking Time Available</Text>
            <View style={styles.chipRow}>
              {COOKING_TIMES.map((t) => <ChipButton key={t} label={t} active={formData.cookingTime === t} onPress={() => set('cookingTime', t)} colors={colors} />)}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Grocery Budget</Text>
            <View style={styles.chipRow}>
              {BUDGET_OPTIONS.map((b) => <ChipButton key={b} label={b} active={formData.groceryBudget === b} onPress={() => set('groceryBudget', b)} colors={colors} />)}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Main Carb Source</Text>
            <View style={styles.chipRow}>
              {CARBS_OPTIONS.map((c) => <ChipButton key={c} label={c} active={formData.mainCarbs === c} onPress={() => set('mainCarbs', c)} colors={colors} />)}
            </View>
          </View>
        );

      case 7: {
        const results = calculateResults();
        const bmiCat = results ? getBmiCategory(results.bmi) : { label: 'Healthy', color: COLORS.teal };
        const calorieVal = results?.cal ? results.cal : null;
        const bmiVal = results?.bmi ? results.bmi : null;
        const weightFrom = formData.weight ? `${formData.weight}` : null;
        const weightTo = formData.targetWeight ? `${formData.targetWeight}` : null;
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text, textAlign: 'center' }]}>Your Health Blueprint</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted, textAlign: 'center' }]}>AI-personalized to your body & goals</Text>

            {/* ── Hero Calorie Card ────────────────────────────────── */}
            <View style={[
              styles.bpHeroCard,
              {
                backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
                borderColor: isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.25)',
              },
            ]}>
              <View style={styles.bpHeroTop}>
                <View style={[
                  styles.bpHeroIconWrap,
                  { backgroundColor: isDark ? 'rgba(16,185,129,0.20)' : 'rgba(16,185,129,0.15)' },
                ]}>
                  <Flame size={22} color={COLORS.primary} />
                </View>
                <View style={styles.bpHeroTextWrap}>
                  <Text style={[styles.bpHeroLabel, { color: colors.textMuted }]}>DAILY CALORIE GOAL</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={[styles.bpHeroValue, { color: colors.text }]}>
                      {calorieVal ? calorieVal.toLocaleString() : '--'}
                    </Text>
                    <Text style={[styles.bpHeroUnit, { color: colors.textMuted }]}>kcal / day</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.bpHeroDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.15)' }]} />
              <Text style={[styles.bpHeroNote, { color: colors.textMuted }]}>
                Calculated using Mifflin-St Jeor formula based on your age, weight, height & activity level
              </Text>
            </View>

            {/* ── BMI + Goal Row ───────────────────────────────────── */}
            <View style={styles.bpRow}>
              {/* BMI Card */}
              <View style={[
                styles.bpHalfCard,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.bgCard,
                  borderColor: isDark ? `${bmiCat.color}40` : `${bmiCat.color}30`,
                },
              ]}>
                <View style={[styles.bpHalfIcon, { backgroundColor: `${bmiCat.color}18` }]}>
                  <Activity size={18} color={bmiCat.color} />
                </View>
                <Text style={[styles.bpHalfLabel, { color: colors.textMuted }]}>BODY MASS INDEX</Text>
                <Text style={[styles.bpHalfValue, { color: bmiCat.color }]}>
                  {bmiVal ?? '--'}
                </Text>
                <View style={[styles.bpBadge, { backgroundColor: `${bmiCat.color}18`, borderColor: `${bmiCat.color}35` }]}>
                  <Text style={[styles.bpBadgeText, { color: bmiCat.color }]}>{bmiCat.label}</Text>
                </View>
              </View>

              {/* Goal Card */}
              <View style={[
                styles.bpHalfCard,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.bgCard,
                  borderColor: colors.border,
                },
              ]}>
                <View style={[styles.bpHalfIcon, { backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.12)' }]}>
                  <Trophy size={18} color={COLORS.teal} />
                </View>
                <Text style={[styles.bpHalfLabel, { color: colors.textMuted }]}>YOUR GOAL</Text>
                <Text style={[styles.bpHalfValue, { color: colors.text, fontSize: 15 }]} numberOfLines={1}>
                  {formData.mainGoal || 'Fitness'}
                </Text>
                {weightFrom && weightTo ? (
                  <View style={[styles.bpBadge, { backgroundColor: isDark ? 'rgba(20,184,166,0.12)' : 'rgba(20,184,166,0.10)', borderColor: 'rgba(20,184,166,0.25)' }]}>
                    <Text style={[styles.bpBadgeText, { color: COLORS.teal }]}>{weightFrom} → {weightTo} kg</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Bottom Info Pill Row ─────────────────────────────── */}
            <View style={[styles.bpInfoRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.bgCard, borderColor: colors.border }]}>
              <View style={styles.bpInfoPill}>
                <Text style={styles.bpInfoEmoji}>💧</Text>
                <View>
                  <Text style={[styles.bpInfoLabel, { color: colors.textMuted }]}>WATER GOAL</Text>
                  <Text style={[styles.bpInfoVal, { color: colors.text }]}>{formData.waterGoal || 3.0} L / day</Text>
                </View>
              </View>
              <View style={[styles.bpInfoDivider, { backgroundColor: colors.border }]} />
              <View style={styles.bpInfoPill}>
                <Text style={styles.bpInfoEmoji}>🥗</Text>
                <View>
                  <Text style={[styles.bpInfoLabel, { color: colors.textMuted }]}>DIET</Text>
                  <Text style={[styles.bpInfoVal, { color: colors.text }]} numberOfLines={1}>
                    {formData.dietaryPreference || 'Balanced'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      }

      case 8:
        return (
          <View>
            <Text style={[styles.stepTitle, { color: colors.text, textAlign: 'center' }]}>Choose Your Plan</Text>
            <Text style={[styles.stepSub, { color: colors.textMuted, textAlign: 'center' }]}>Simple, transparent pricing. Upgrade or cancel anytime.</Text>

            {PLANS.map((plan) => {
              const isSelected = formData.selectedPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: isSelected
                        ? COLORS.primary
                        : plan.recommended
                        ? 'rgba(20,184,166,0.5)'
                        : colors.border,
                    },
                    isSelected && {
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.65)' : COLORS.primary,
                      borderWidth: 1.5,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                    },
                  ]}
                  onPress={() => set('selectedPlan', plan.id)}
                >
                  {plan.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Star size={10} color="#fff" fill="#fff" />
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.planTag, { color: isSelected ? COLORS.primary : plan.recommended ? COLORS.teal : colors.textSecondary }]}>
                          {plan.tag}
                        </Text>
                        {isSelected && (
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#ffffff" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.planSubtitle, { color: colors.textMuted }]}>{plan.subtitle}</Text>
                    </View>
                    <View style={styles.planPriceWrap}>
                      {plan.free ? (
                        <Text style={[styles.planPrice, { color: isSelected ? COLORS.primary : colors.text }]}>Free</Text>
                      ) : (
                        <Text style={[styles.planPrice, { color: isSelected ? COLORS.primary : colors.text }]}>
                          ₹{plan.price}<Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>/mo</Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={[styles.planFeatures, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(20,184,166,0.12)' }]}>
                    {plan.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Check size={12} color={isSelected ? COLORS.primary : COLORS.teal} strokeWidth={3} />
                        <Text style={[styles.featureText, { color: isSelected ? colors.text : colors.textSecondary }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            })}

            {errorMsg ? <Text style={styles.errorMsg}>{errorMsg}</Text> : null}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { borderColor: colors.border }]}>
          <Pressable onPress={handleBack} style={[styles.backBtn, { backgroundColor: colors.bgCard }]}>
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>

          <View style={styles.progressWrapper}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.stepCount, { color: colors.textMuted }]}>{step}/{TOTAL_STEPS}</Text>
          </View>

          {/* Quick Save Button on Every Step */}
          <Pressable onPress={handleQuickSave} style={styles.quickSaveBtn}>
            <Text style={styles.quickSaveText}>Save</Text>
          </Pressable>

          {/* Skip Button */}
          {step < TOTAL_STEPS && (
            <Pressable onPress={handleSkipStep} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          )}
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ transform: [{ translateY: stepSlide }] }}>
              {renderStep()}
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Footer with Save & Exit + Continue */}
        <View style={[styles.footer, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
          <View style={styles.footerRow}>
            <Pressable
              onPress={handleQuickSave}
              style={[styles.footerSaveBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
            >
              <Text style={[styles.footerSaveText, { color: colors.textSecondary }]}>Save & Exit</Text>
            </Pressable>

            <View style={{ flex: 1.4 }}>
              {step < TOTAL_STEPS ? (
                <Button title="Continue →" onPress={handleNext} size="lg" />
              ) : (
                <Button title="Complete & Launch" onPress={handleFinish} loading={loading} disabled={loading} size="lg" />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="Saving your personalized profile..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  progressWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 6, borderRadius: RADIUS.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  stepCount: { fontSize: FONT_SIZES.xs, fontWeight: '700', minWidth: 32 },

  skipBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(16,185,129,0.1)', marginLeft: 6 },
  skipText: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: COLORS.primary },

  quickSaveBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginLeft: 8 },
  quickSaveText: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: '#ffffff' },

  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footerSaveBtn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: RADIUS.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  footerSaveText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },

  scroll: { padding: SPACING.xl, paddingBottom: 140 },
  stepTitle: { fontSize: 26, fontWeight: '900', marginBottom: 6, letterSpacing: -0.5 },
  stepSub: { fontSize: FONT_SIZES.base, marginBottom: SPACING.xl, lineHeight: 22 },

  fieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 10, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: SPACING.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  addChipRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  addChipInput: { flex: 1, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 14, height: 46, fontSize: 14 },
  addChipBtn: { width: 46, height: 46, borderRadius: RADIUS.xl, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  optionBtn: {
    paddingVertical: 16,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  optionBtnText: { fontSize: 16, fontWeight: '700' },

  dobRow: { flexDirection: 'row', marginBottom: SPACING.lg },
  dobBox: {
    height: 52,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dobInput: {
    height: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center',
    includeFontPadding: false,
    fontSize: 17,
    fontWeight: '700',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },
  dobInputShort: {
    width: 36,
  },
  dobInputLong: {
    width: 62,
  },
  row2: { flexDirection: 'row' },

  photoSection: { alignItems: 'center', marginBottom: SPACING.xl },
  photoPick: { width: 96, height: 96, borderRadius: 48, position: 'relative' },
  photoImg: { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  photoHint: { fontSize: 12, marginTop: 8 },

  resultCard: {
    width: '100%',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  resultLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginTop: 8, marginBottom: 4 },
  resultValue: { fontSize: 28, fontWeight: '900' },

  // ── Health Blueprint Step 7 Styles ──────────────────────────
  bpHeroCard: {
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  bpHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  bpHeroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bpHeroTextWrap: { flex: 1 },
  bpHeroLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  bpHeroValue: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
  },
  bpHeroUnit: {
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 4,
  },
  bpHeroDivider: {
    height: 1,
    marginBottom: 10,
  },
  bpHeroNote: {
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },

  bpRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  bpHalfCard: {
    flex: 1,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'flex-start',
    gap: 6,
    ...SHADOWS.sm,
  },
  bpHalfIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bpHalfLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  bpHalfValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 2,
  },
  bpBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  bpInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  bpInfoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bpInfoEmoji: {
    fontSize: 22,
  },
  bpInfoLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 1,
  },
  bpInfoVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  bpInfoDivider: {
    width: 1,
    height: 36,
    marginHorizontal: SPACING.md,
  },

  // Plan cards (Clean, soft borders, zero harsh black lines)
  planCard: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    position: 'relative',
    elevation: 0,
    shadowColor: 'transparent',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  recommendedText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planTag: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  planSubtitle: { fontSize: 12, marginTop: 2 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: 26, fontWeight: '900' },
  planFeatures: { gap: 8, paddingTop: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontWeight: '600' },

  errorMsg: { fontSize: 13, color: COLORS.error, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  footer: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.base, borderTopWidth: 1 },
});
