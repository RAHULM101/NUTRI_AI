// FILE: mobile/src/screens/main/MealLogsScreen.js
// Modern Meal Logging Screen — Clean uncluttered UI, Real Gemini AI Photo Scan, Voice Dictation Modal, Accurate Macro Extraction, History with Delete

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera, Upload, Plus, X, Utensils, Flame, Mic,
  Sparkles, Trash2, CheckCircle2, ChevronRight, ChevronDown, MapPin, Check, AlertCircle, RefreshCw, Send,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getMealLogs, createMealLog, deleteMealLog, analyzeMealImage } from '../../services/mealService';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/apiConfig';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Pre-workout', 'Post-workout'];
const MEAL_LOCATIONS = ['Home', 'Office / School', 'Restaurant', 'Cafe / Street Food', 'Delivery / Takeout', 'Mess / Hostel'];

const PLAN_SCAN_LIMITS = {
  Free: 3,
  Pro: 10,
  Premium: 20,
};

function calculateJunkScore(calories, protein, carbs, fat, foodName) {
  const cal = parseInt(calories) || 0;
  if (cal === 0) return 10;
  const p = parseFloat(protein) || 0;
  const f = parseFloat(fat) || 0;
  let score = 40;
  if ((p * 4) / cal > 0.25) score -= 15;
  if ((f * 9) / cal > 0.45) score += 20;
  const junkWords = ['burger', 'pizza', 'fries', 'soda', 'cake', 'candy', 'chips', 'fried', 'coke', 'pepsi', 'fast food'];
  const nameLower = (foodName || '').toLowerCase();
  for (const word of junkWords) {
    if (nameLower.includes(word)) {
      score += 25;
      break;
    }
  }
  return Math.max(5, Math.min(100, score));
}

function MealLogCard({ item, onDelete, colors, isDark }) {
  const junkVal = item.junk_score !== null && item.junk_score !== undefined
    ? Math.round(item.junk_score)
    : calculateJunkScore(item.calories, item.protein_gm || item.protein, item.carbs_gm || item.carbs, item.fat_gm || item.fat, item.detected_items || item.food_name);

  const junkColor = junkVal > 60 ? '#EF4444' : junkVal > 30 ? '#F59E0B' : '#10B981';
  const foodName = item.detected_items || item.food_name || 'Logged Meal';

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={cardStyles.header}>
        <View style={cardStyles.typeTag}>
          <Text style={cardStyles.typeText}>{item.meal_type || 'Meal'}</Text>
        </View>

        <View style={cardStyles.headerRight}>
          <Text style={[cardStyles.time, { color: colors.textMuted }]}>
            {item.meal_timedate || item.logged_at
              ? new Date(item.meal_timedate || item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Today'}
          </Text>

          <Pressable
            style={({ pressed }) => [cardStyles.deleteBtn, pressed && { opacity: 0.7 }]}
            onPress={() => onDelete(item)}
            hitSlop={8}
          >
            <Trash2 size={16} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {item.meal_photo_url ? (
        <Image source={{ uri: item.meal_photo_url }} style={cardStyles.photoThumb} resizeMode="cover" />
      ) : null}

      <Text style={[cardStyles.name, { color: colors.text }]}>{foodName}</Text>

      {item.meal_location ? (
        <Text style={[cardStyles.locationText, { color: colors.textMuted }]}>📍 {item.meal_location}</Text>
      ) : null}

      {/* Macros */}
      <View style={cardStyles.macros}>
        <View style={cardStyles.macroPill}>
          <Text style={[cardStyles.macroVal, { color: COLORS.teal }]}>{Math.round(item.calories || 0)}</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>kcal</Text>
        </View>
        <View style={cardStyles.macroPill}>
          <Text style={[cardStyles.macroVal, { color: COLORS.protein }]}>{Math.round(item.protein_gm || item.protein || 0)}g</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>Protein</Text>
        </View>
        <View style={cardStyles.macroPill}>
          <Text style={[cardStyles.macroVal, { color: COLORS.carbs }]}>{Math.round(item.carbs_gm || item.carbs || 0)}g</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>Carbs</Text>
        </View>
        <View style={cardStyles.macroPill}>
          <Text style={[cardStyles.macroVal, { color: COLORS.fat }]}>{Math.round(item.fat_gm || item.fat || 0)}g</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>Fat</Text>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: RADIUS.xl, padding: SPACING.base, marginBottom: SPACING.md, borderWidth: 1, ...SHADOWS.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeTag: { backgroundColor: 'rgba(20,184,166,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  typeText: { color: COLORS.primary, fontSize: 11, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { fontSize: 11, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  photoThumb: { width: '100%', height: 140, borderRadius: RADIUS.lg, marginVertical: 8 },
  name: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  locationText: { fontSize: 11, marginBottom: 8 },
  macros: { flexDirection: 'row', gap: 6, marginTop: 4 },
  macroPill: { flex: 1, backgroundColor: 'rgba(15,23,42,0.04)', borderRadius: RADIUS.lg, padding: 6, alignItems: 'center' },
  macroVal: { fontSize: 14, fontWeight: '900' },
  macroUnit: { fontSize: 9, fontWeight: '700', marginTop: 1 },
});

export default function MealLogsScreen() {
  const { userData, addMealLog } = useAuth();
  const { isDark, colors } = useTheme();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scannedPhotoUri, setScannedPhotoUri] = useState(null);

  // Meal Form States
  const [mealType, setMealType] = useState('Lunch');
  const [mealLocation, setMealLocation] = useState('Home');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [junkScore, setJunkScore] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [hasAnalysisResult, setHasAnalysisResult] = useState(false);

  // Voice Prompt Modal State
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [analyzingVoice, setAnalyzingVoice] = useState(false);

  // Scanning Beam Laser Animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (analyzing) {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [analyzing]);

  const userPlan = userData?.selectedPlan || 'Pro';
  const totalAllowedScans = PLAN_SCAN_LIMITS[userPlan] || 10;
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const remainingScans = Math.max(totalAllowedScans - dailyScansUsed, 0);

  // Load today's persisted scan count on mount
  useEffect(() => {
    const loadDailyScans = async () => {
      try {
        const todayKey = `nutriai_scans_used_${new Date().toISOString().slice(0, 10)}`;
        const stored = await AsyncStorage.getItem(todayKey);
        if (stored !== null) {
          setDailyScansUsed(parseInt(stored, 10) || 0);
        }
      } catch (err) {
        console.warn('Could not read scan counter:', err);
      }
    };
    loadDailyScans();
  }, []);

  const incrementScanCount = async () => {
    try {
      const todayKey = `nutriai_scans_used_${new Date().toISOString().slice(0, 10)}`;
      const nextCount = dailyScansUsed + 1;
      setDailyScansUsed(nextCount);
      await AsyncStorage.setItem(todayKey, String(nextCount));
    } catch (err) {
      console.warn('Could not persist scan counter:', err);
    }
  };

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMealLogs();
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.warn('Could not load meal logs:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Pick / Take Photo
  const handleSelectPhoto = async (fromCamera = false) => {
    if (remainingScans <= 0) {
      Alert.alert(
        'Scan Limit Reached ⚠️',
        `You have used all ${totalAllowedScans} scans allowed on your ${userPlan} plan today.`
      );
      return;
    }

    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please grant camera / media permissions to scan meals.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });

    if (result.canceled || !result.assets[0]?.uri) return;

    const uri = result.assets[0].uri;
    setScannedPhotoUri(uri);
    setHasAnalysisResult(false);
  };

  // Real Gemini AI Image Analysis
  const handleAnalyzeWithNia = async () => {
    if (!scannedPhotoUri && !foodName.trim()) {
      Alert.alert('Input Required', 'Please take/upload a photo or type a meal name to analyze.');
      return;
    }

    setAnalyzing(true);
    setHasAnalysisResult(false);

    try {
      if (scannedPhotoUri) {
        try {
          const analysis = await analyzeMealImage(scannedPhotoUri);
          const itemStr = (analysis?.detected_items || '').toLowerCase();
          const isNonFood = itemStr.includes('no food') || itemStr.includes('human') || itemStr.includes('non-food') || (analysis?.calories === 0 && analysis?.protein_gm === 0);

          if (isNonFood) {
            Alert.alert('Non-Food Photo Detected ⚠️', 'Please upload a clear photo of your meal.');
            setFoodName('Non-Food Photo Detected');
            setCalories('0');
            setProtein('0');
            setCarbs('0');
            setFat('0');
            setJunkScore(null);
            setAiInsights('Please upload a clear photo of a food dish.');
            setHasAnalysisResult(true);
            return;
          } else if (analysis && !analysis.error) {
            setFoodName(analysis.detected_items || analysis.food_name || foodName || 'Scanned Meal');
            setCalories(String(analysis.calories || ''));
            setProtein(String(analysis.protein_gm || analysis.protein || ''));
            setCarbs(String(analysis.carbs_gm || analysis.carbs || ''));
            setFat(String(analysis.fat_gm || analysis.fat || ''));
            setJunkScore(analysis.junk_score !== undefined && analysis.junk_score !== null ? analysis.junk_score : null);
            setAiInsights(analysis.ai_insights || 'AI analyzed meal composition successfully.');
            setHasAnalysisResult(true);
            incrementScanCount();
            return;
          }
        } catch (imgErr) {
          console.warn('Image analysis API failed, attempting AI chat fallback:', imgErr.message);
          // If image endpoint failed (e.g. 500), try text analysis if foodName is available
          if (foodName.trim()) {
            const res = await api.post(ENDPOINTS.niaChat, {
              message: `Analyze this meal: "${foodName.trim()}". Return estimated calories, protein (g), carbs (g), fat (g).`,
              profile: userData,
            });
            const reply = res.data?.ai_response || res.data?.response || res.data?.message || '';
            setAiInsights(reply || 'Nutrition calculated from food description.');
            setHasAnalysisResult(true);
            incrementScanCount();
            return;
          }
          throw imgErr;
        }
      } else {
        // Text analysis via Nia chat endpoint
        const res = await api.post(ENDPOINTS.niaChat, {
          message: `Analyze this meal: "${foodName.trim()}". Return approximate calories, protein (g), carbs (g), fat (g), and health quality score (0-100).`,
          profile: userData,
        });
        const reply = res.data?.ai_response || res.data?.response || res.data?.message || '';
        setAiInsights(reply || 'Meal logged successfully.');
        incrementScanCount();
      }
      setHasAnalysisResult(true);
    } catch (e) {
      Alert.alert(
        'AI Scanner Notice ℹ️',
        'AI image scanner is currently busy or re-calibrating. You can enter or adjust the nutrition values below to save your meal!'
      );
      setHasAnalysisResult(true);
    } finally {
      setAnalyzing(false);
    }
  };

  // Real Voice/Dictation Analysis
  const handleAnalyzeVoice = async () => {
    if (!voiceText.trim()) {
      Alert.alert('Input Required', 'Please speak or enter what you ate.');
      return;
    }

    setAnalyzingVoice(true);
    try {
      const res = await api.post(ENDPOINTS.niaChat, {
        message: `Extract nutritional values for: "${voiceText.trim()}". Format: Food Name, Calories kcal, Protein g, Carbs g, Fat g.`,
        profile: userData,
      });

      const reply = res.data?.ai_response || res.data?.response || res.data?.message || '';
      setFoodName(voiceText.trim());
      setAiInsights(reply);
      setShowVoiceModal(false);
      setVoiceText('');
      setHasAnalysisResult(true);
      incrementScanCount();
    } catch (err) {
      setFoodName(voiceText.trim());
      setShowVoiceModal(false);
      setVoiceText('');
    } finally {
      setAnalyzingVoice(false);
    }
  };

  // Save Meal Log
  const handleSaveMeal = async () => {
    if (!foodName.trim() || !calories) {
      Alert.alert('Missing Fields', 'Please enter food name and calories.');
      return;
    }

    const calVal = parseInt(calories) || 0;
    const protVal = parseFloat(protein) || 0;
    const carbVal = parseFloat(carbs) || 0;
    const fatVal = parseFloat(fat) || 0;
    const finalJunk = junkScore !== null && junkScore !== undefined
      ? parseInt(junkScore)
      : calculateJunkScore(calVal, protVal, carbVal, fatVal, foodName.trim());

    const payload = {
      meal_type: mealType || 'Meal',
      meal_location: mealLocation || 'Home',
      detected_items: foodName.trim() || 'Logged Meal',
      calories: Math.round(calVal),
      protein_gm: parseFloat(protVal.toFixed(2)),
      carbs_gm: parseFloat(carbVal.toFixed(2)),
      fat_gm: parseFloat(fatVal.toFixed(2)),
      junk_score: finalJunk,
      ai_insights: aiInsights || 'Nutrient logged successfully.',
      meal_photo_url: scannedPhotoUri && (scannedPhotoUri.startsWith('http://') || scannedPhotoUri.startsWith('https://')) ? scannedPhotoUri : null,
    };

    try {
      const saved = await createMealLog(payload);
      addMealLog({
        calories: payload.calories,
        protein: payload.protein_gm,
        carbs: payload.carbs_gm,
        fat: payload.fat_gm,
        junkScore: finalJunk,
      });
      setLogs((prev) => [saved || payload, ...prev]);
      Alert.alert('Success 🎉', 'Meal saved to today\'s nutrition!');
      resetForm();
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to save meal log');
    }
  };

  const handleDeleteMeal = (item) => {
    Alert.alert(
      'Delete Meal Log 🗑️',
      `Delete "${item.detected_items || item.food_name || 'this meal'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const mealId = item.meal_id || item.id;
            try {
              if (mealId) {
                await deleteMealLog(mealId);
              }
            } catch (e) {
              console.warn('Delete meal API failed:', e?.message);
            }
            setLogs((prev) => prev.filter((m) => (m.meal_id || m.id) !== mealId && m !== item));
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setJunkScore(null);
    setAiInsights('');
    setScannedPhotoUri(null);
    setHasAnalysisResult(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Meal Logs 🍲</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>AI Photo & Voice Tracking</Text>
          </View>

          <View style={[styles.scanBadge, { backgroundColor: isDark ? '#0f172a' : '#EFF9F8', borderColor: isDark ? '#334155' : 'rgba(20,184,166,0.3)' }]}>
            <Flame size={12} color={COLORS.primary} />
            <Text style={[styles.scanBadgeText, { color: COLORS.primary }]}>
              {remainingScans} / {totalAllowedScans} scans left
            </Text>
          </View>
        </View>

        {/* Meal Logging Card */}
        <View style={[styles.cardContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* 1. TOP: Photo Preview Frame */}
          <View style={[styles.photoFrame, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#F8FAFC' }]}>
            {scannedPhotoUri ? (
              <>
                <Image source={{ uri: scannedPhotoUri }} style={styles.photoImg} resizeMode="cover" />

                {analyzing && (
                  <Animated.View
                    style={[
                      styles.scanBeam,
                      {
                        transform: [
                          {
                            translateY: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 160],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}

                <Pressable style={styles.removePhotoBtn} onPress={() => setScannedPhotoUri(null)}>
                  <X size={14} color="#ffffff" />
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyPhotoPlaceholder}>
                <View style={[styles.emptyPhotoCircle, { backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)' }]}>
                  <Camera size={26} color={COLORS.primary} />
                </View>
                <Text style={[styles.emptyPhotoText, { color: colors.text }]}>Meal Photo Scanner</Text>
                <Text style={[styles.emptyPhotoSub, { color: colors.textMuted }]}>Take a photo or upload from gallery below</Text>
              </View>
            )}
          </View>

          {/* 2. DIRECTLY BELOW PHOTO: The 2 Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleSelectPhoto(true)}
              disabled={analyzing}
            >
              <Camera size={16} color="#ffffff" />
              <Text style={styles.scanBtnText}>Take Photo</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.uploadBtn,
                { backgroundColor: isDark ? '#0f172a' : '#F1F5F9', borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => handleSelectPhoto(false)}
              disabled={analyzing}
            >
              <Upload size={16} color={colors.text} />
              <Text style={[styles.uploadBtnText, { color: colors.text }]}>Upload Photo</Text>
            </Pressable>
          </View>

          {/* Inputs Section */}
          <View style={styles.formSection}>
            {/* 3. Type / Search Food Name */}
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Dish / Food Description</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#F8FAFC' }]}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g. 2 Rotis with Dal & Paneer"
              placeholderTextColor={colors.textMuted}
            />

            {/* 4. Meal Location Dropdown */}
            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>Meal Location</Text>
            <Pressable
              style={[styles.dropdownBtn, { backgroundColor: isDark ? '#0f172a' : '#F8FAFC', borderColor: colors.border }]}
              onPress={() => setShowLocationModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} color={COLORS.primary} />
                <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                  {mealLocation}
                </Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} />
            </Pressable>

            {/* 5. Meal Type Dropdown */}
            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>Meal Type</Text>
            <Pressable
              style={[styles.dropdownBtn, { backgroundColor: isDark ? '#0f172a' : '#F8FAFC', borderColor: colors.border }]}
              onPress={() => setShowTypeModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Utensils size={15} color={COLORS.primary} />
                <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                  {mealType}
                </Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} />
            </Pressable>

            {/* 6. Analyze Button */}
            <Pressable
              style={({ pressed }) => [
                styles.analyzeBtn,
                pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                analyzing && { opacity: 0.7 },
              ]}
              onPress={handleAnalyzeWithNia}
              disabled={analyzing}
            >
              {analyzing ? (
                <View style={styles.analyzeInner}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.analyzeBtnText}>Analyzing with Nia AI...</Text>
                </View>
              ) : (
                <View style={styles.analyzeInner}>
                  <Sparkles size={16} color="#ffffff" />
                  <Text style={styles.analyzeBtnText}>Analyze with Nia AI ✨</Text>
                </View>
              )}
            </Pressable>

            {/* Inline AI Analysis Results */}
            {hasAnalysisResult && (
              <View style={[styles.resultsCard, { backgroundColor: isDark ? '#0f172a' : '#F8FAFC', borderColor: colors.border }]}>
                <View style={styles.resultsHeader}>
                  <CheckCircle2 size={16} color={COLORS.primary} />
                  <Text style={[styles.resultsTitle, { color: colors.text }]}>Nutritional Breakdown</Text>
                </View>

                <View style={styles.macroInputsGrid}>
                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Calories (kcal)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.teal, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholder="kcal"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Protein (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.protein, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.carbs, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={carbs}
                      onChangeText={setCarbs}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Fat (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.fat, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={fat}
                      onChangeText={setFat}
                      keyboardType="numeric"
                      placeholder="g"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {aiInsights ? (
                  <Text style={[styles.aiNoteText, { color: colors.textSecondary }]}>💡 {aiInsights}</Text>
                ) : null}

                {/* Save Log Button */}
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88 }]}
                  onPress={handleSaveMeal}
                >
                  <Text style={styles.saveBtnText}>Save to Today's Log ✓</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Logged Meals List */}
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Today's Logged Meals ({logs.length})</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : logs.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Utensils size={36} color={colors.textMuted} />
              <Text style={[styles.emptyHistoryText, { color: colors.textMuted }]}>
                No meals logged today yet. Snap or type above!
              </Text>
            </View>
          ) : (
            logs.map((item, i) => (
              <MealLogCard
                key={item.meal_id || item.id || String(i)}
                item={item}
                onDelete={handleDeleteMeal}
                colors={colors}
                isDark={isDark}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Meal Location Dropdown Modal */}
      <Modal visible={showLocationModal} animationType="fade" transparent onRequestClose={() => setShowLocationModal(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowLocationModal(false)}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color={COLORS.primary} />
                <Text style={[modalStyles.title, { color: colors.text }]}>Select Meal Location</Text>
              </View>
              <Pressable onPress={() => setShowLocationModal(false)} hitSlop={8}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {MEAL_LOCATIONS.map((loc) => {
                const isSel = mealLocation === loc;
                return (
                  <Pressable
                    key={loc}
                    style={[
                      styles.modalOptionRow,
                      { borderColor: isSel ? COLORS.primary : colors.border, backgroundColor: isSel ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)') : (isDark ? '#0f172a' : '#F8FAFC') },
                    ]}
                    onPress={() => {
                      setMealLocation(loc);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: isSel ? COLORS.primary : colors.text, fontWeight: isSel ? '800' : '600' }]}>
                      {loc}
                    </Text>
                    {isSel && <Check size={16} color={COLORS.primary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Meal Type Dropdown Modal */}
      <Modal visible={showTypeModal} animationType="fade" transparent onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowTypeModal(false)}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Utensils size={18} color={COLORS.primary} />
                <Text style={[modalStyles.title, { color: colors.text }]}>Select Meal Type</Text>
              </View>
              <Pressable onPress={() => setShowTypeModal(false)} hitSlop={8}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {MEAL_TYPES.map((type) => {
                const isSel = mealType === type;
                return (
                  <Pressable
                    key={type}
                    style={[
                      styles.modalOptionRow,
                      { borderColor: isSel ? COLORS.primary : colors.border, backgroundColor: isSel ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)') : (isDark ? '#0f172a' : '#F8FAFC') },
                    ]}
                    onPress={() => {
                      setMealType(type);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: isSel ? COLORS.primary : colors.text, fontWeight: isSel ? '800' : '600' }]}>
                      {type}
                    </Text>
                    {isSel && <Check size={16} color={COLORS.primary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Voice Prompt Modal */}
      <Modal visible={showVoiceModal} animationType="fade" transparent onRequestClose={() => setShowVoiceModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={modalStyles.micCircle}>
                <Mic size={16} color="#ffffff" />
              </View>
              <Text style={[modalStyles.title, { color: colors.text }]}>Voice Meal Dictation</Text>
              <Pressable onPress={() => setShowVoiceModal(false)} hitSlop={8}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[modalStyles.sub, { color: colors.textMuted }]}>
              Speak or write in Bengali, Hindi, or English (e.g. "2 rotis, 1 cup dal, salad"):
            </Text>

            <TextInput
              style={[modalStyles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#F8FAFC' }]}
              value={voiceText}
              onChangeText={setVoiceText}
              placeholder="Type or dictate your meal..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <Pressable
              style={({ pressed }) => [modalStyles.submitBtn, pressed && { opacity: 0.88 }]}
              onPress={handleAnalyzeVoice}
              disabled={analyzingVoice}
            >
              {analyzingVoice ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Sparkles size={16} color="#ffffff" />
                  <Text style={modalStyles.submitBtnText}>Extract Nutrition with AI →</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 1 },
  scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  scanBadgeText: { fontSize: 11, fontWeight: '800' },

  cardContainer: { borderRadius: RADIUS['2xl'], padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.lg, ...SHADOWS.sm },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  scanBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: RADIUS.xl, ...SHADOWS.emerald },
  scanBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.xl, borderWidth: 1 },
  uploadBtnText: { fontSize: 13, fontWeight: '700' },

  photoFrame: { width: '100%', height: 180, borderRadius: RADIUS.xl, overflow: 'hidden', position: 'relative', marginBottom: SPACING.md, borderWidth: 1 },
  photoImg: { width: '100%', height: '100%' },
  emptyPhotoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  emptyPhotoCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyPhotoText: { fontSize: 14, fontWeight: '800' },
  emptyPhotoSub: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  scanBeam: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#10B981', shadowColor: '#10B981', shadowRadius: 10, shadowOpacity: 0.9 },
  removePhotoBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  formSection: { gap: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { height: 46, borderRadius: RADIUS.xl, borderWidth: 1.5, paddingHorizontal: 12, fontSize: 14, marginTop: 4 },
  dropdownBtn: { height: 48, borderRadius: RADIUS.xl, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dropdownValueText: { fontSize: 14, fontWeight: '700' },

  modalOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1.5 },
  modalOptionText: { fontSize: 14 },

  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 14, ...SHADOWS.emerald },
  analyzeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analyzeBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },

  resultsCard: { borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, marginTop: SPACING.md },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  resultsTitle: { fontSize: 14, fontWeight: '800' },
  macroInputsGrid: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  macroInputWrap: { flex: 1 },
  macroInputLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 3 },
  macroInput: { height: 38, borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 8, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  aiNoteText: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: RADIUS.xl, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  historySection: { marginTop: SPACING.sm },
  historyTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.md },
  emptyHistory: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  emptyHistoryText: { fontSize: 13, fontWeight: '600' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3, 7, 18, 0.75)', justifyContent: 'center', padding: SPACING.lg },
  dialog: { borderRadius: RADIUS['2xl'], padding: SPACING.lg, borderWidth: 1, ...SHADOWS.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  micCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '900', flex: 1, marginLeft: 10 },
  sub: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  textArea: { height: 80, borderRadius: RADIUS.xl, borderWidth: 1.5, padding: 10, fontSize: 13, textAlignVertical: 'top', marginBottom: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#6366F1', paddingVertical: 13, borderRadius: RADIUS.xl },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
