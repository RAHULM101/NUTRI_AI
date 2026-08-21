// FILE: mobile/src/screens/main/MealLogsScreen.js
// Meal Logging Screen — AI Photo Scan, Voice Dictation, Portion Control,
// Quantity Stepper, Per-100g Toggle, Food Name Edit + Auto-Fix, Junk Score Display, Haptics & Polish

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  Sparkles, Trash2, CheckCircle2, ChevronDown, MapPin, Check,
  Edit3, RotateCcw,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getMealLogs, createMealLog, deleteMealLog, analyzeMealImage } from '../../services/mealService';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/apiConfig';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Pre-workout', 'Post-workout'];
const MEAL_LOCATIONS = ['Home', 'Office / School', 'Restaurant', 'Cafe / Street Food', 'Delivery / Takeout', 'Mess / Hostel'];
const PORTION_CHIPS = [
  { label: 'Full Plate', value: 1.0 },
  { label: '3/4 Plate', value: 0.75 },
  { label: 'Half Plate', value: 0.5 },
  { label: '1/4 Plate', value: 0.25 },
];

const SCAN_STAGES = [
  'Detecting meal dishes...',
  'Estimating portion size...',
  'Calculating macro breakdown...',
  'Finalizing nutritional insights...',
];

const PLAN_SCAN_LIMITS = { Free: 3, Pro: 10, Premium: 20 };

// ─── Junk Score Helper ─────────────────────────────────────────────────────────
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
    if (nameLower.includes(word)) { score += 25; break; }
  }
  return Math.max(5, Math.min(100, score));
}

// ─── Junk Score Badge ─────────────────────────────────────────────────────────
function JunkBadge({ score, small = false }) {
  const val = Math.round(score || 0);
  const color = val > 60 ? '#EF4444' : val > 30 ? '#F59E0B' : '#10B981';
  const label = val > 60 ? '🔴 High Junk' : val > 30 ? '🟡 Moderate' : '🟢 Clean Fuel';
  if (small) {
    return (
      <View style={[junkStyles.smallBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
        <Text style={[junkStyles.smallText, { color }]}>{val}</Text>
      </View>
    );
  }
  return (
    <View style={[junkStyles.badge, { backgroundColor: color + '12', borderColor: color + '35' }]}>
      <Text style={[junkStyles.badgeLabel, { color }]}>{label}</Text>
      <Text style={[junkStyles.badgeScore, { color }]}>{val}/100</Text>
    </View>
  );
}

const junkStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, alignSelf: 'flex-start', marginTop: 8 },
  badgeLabel: { fontSize: 11, fontWeight: '800' },
  badgeScore: { fontSize: 11, fontWeight: '700' },
  smallBadge: { width: 30, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  smallText: { fontSize: 10, fontWeight: '900' },
});

// ─── Meal Log History Card ─────────────────────────────────────────────────────
function MealLogCard({ item, onDelete, colors, isDark }) {
  const junkVal = item.junk_score !== null && item.junk_score !== undefined
    ? Math.round(item.junk_score)
    : calculateJunkScore(item.calories, item.protein_gm || item.protein, item.carbs_gm || item.carbs, item.fat_gm || item.fat, item.detected_items || item.food_name);
  const foodName = item.detected_items || item.food_name || 'Logged Meal';

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={cardStyles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={cardStyles.typeTag}>
            <Text style={cardStyles.typeText}>{item.meal_type || 'Meal'}</Text>
          </View>
          <JunkBadge score={junkVal} small />
        </View>

        <View style={cardStyles.headerRight}>
          <Text style={[cardStyles.time, { color: colors.textMuted }]}>
            {item.meal_timedate || item.logged_at
              ? new Date(item.meal_timedate || item.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Today'}
          </Text>
          <Pressable
            style={({ pressed }) => [cardStyles.deleteBtn, pressed && { opacity: 0.6 }]}
            onPress={() => onDelete(item)}
            hitSlop={10}
          >
            <Trash2 size={15} color="#EF4444" />
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

      {/* Macros Display */}
      <View style={cardStyles.macros}>
        <View style={[cardStyles.macroPill, { backgroundColor: 'rgba(20,184,166,0.08)' }]}>
          <Text style={[cardStyles.macroVal, { color: COLORS.teal }]}>{Math.round(item.calories || 0)}</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>kcal</Text>
        </View>
        <View style={[cardStyles.macroPill, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
          <Text style={[cardStyles.macroVal, { color: COLORS.protein }]}>{Math.round(item.protein_gm || item.protein || 0)}g</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>Protein</Text>
        </View>
        <View style={[cardStyles.macroPill, { backgroundColor: 'rgba(245,158,11,0.08)' }]}>
          <Text style={[cardStyles.macroVal, { color: COLORS.carbs }]}>{Math.round(item.carbs_gm || item.carbs || 0)}g</Text>
          <Text style={[cardStyles.macroUnit, { color: colors.textMuted }]}>Carbs</Text>
        </View>
        <View style={[cardStyles.macroPill, { backgroundColor: 'rgba(236,72,153,0.08)' }]}>
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
  name: { fontSize: 16, fontWeight: '800', marginBottom: 4, letterSpacing: -0.2 },
  locationText: { fontSize: 11, marginBottom: 8 },
  macros: { flexDirection: 'row', gap: 6, marginTop: 4 },
  macroPill: { flex: 1, borderRadius: RADIUS.lg, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
  macroVal: { fontSize: 14, fontWeight: '900' },
  macroUnit: { fontSize: 9, fontWeight: '700', marginTop: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MealLogsScreen() {
  const { userData, addMealLog, removeMealLog } = useAuth();
  const { isDark, colors } = useTheme();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scannedPhotoUri, setScannedPhotoUri] = useState(null);

  // Meal Form
  const [mealType, setMealType] = useState('Lunch');
  const [mealLocation, setMealLocation] = useState('Home');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [junkScore, setJunkScore] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [hasAnalysisResult, setHasAnalysisResult] = useState(false);

  // Pre-scan portion hint
  const [portionHint, setPortionHint] = useState('');

  // Base macros from AI (full plate values)
  const [baseCalories, setBaseCalories] = useState(0);
  const [baseProtein, setBaseProtein] = useState(0);
  const [baseCarbs, setBaseCarbs] = useState(0);
  const [baseFat, setBaseFat] = useState(0);
  const [totalWeightG, setTotalWeightG] = useState(0);

  // Quantity / Portion state
  const [detectedCount, setDetectedCount] = useState(0);
  const [unitLabel, setUnitLabel] = useState('serving');
  const [isCountable, setIsCountable] = useState(false);
  const [eatenCount, setEatenCount] = useState(1);
  const [portionFraction, setPortionFraction] = useState(1.0);

  // Per 100g toggle
  const [showPer100g, setShowPer100g] = useState(false);

  // Food name editing + auto-fix
  const [autoFixLoading, setAutoFixLoading] = useState(false);
  const foodNameRef = useRef(null);

  // Voice Modal
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [analyzingVoice, setAnalyzingVoice] = useState(false);

  // Scan Beam Animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let stepTimer;
    if (analyzing) {
      scanAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();

      setScanStepIndex(0);
      stepTimer = setInterval(() => {
        setScanStepIndex((prev) => (prev + 1) % SCAN_STAGES.length);
      }, 1500);
    } else {
      scanAnim.stopAnimation();
      if (stepTimer) clearInterval(stepTimer);
    }
    return () => {
      if (stepTimer) clearInterval(stepTimer);
    };
  }, [analyzing]);

  // Derived display macros (client-side math, 0 extra API calls)
  const displayMultiplier = isCountable
    ? (detectedCount > 0 ? eatenCount / detectedCount : 1)
    : portionFraction;

  const displayCalories = Math.round(baseCalories * displayMultiplier);
  const displayProtein  = parseFloat((baseProtein * displayMultiplier).toFixed(1));
  const displayCarbs    = parseFloat((baseCarbs * displayMultiplier).toFixed(1));
  const displayFat      = parseFloat((baseFat * displayMultiplier).toFixed(1));

  // Per 100g values
  const per100gCalories = totalWeightG > 0 ? Math.round((baseCalories / totalWeightG) * 100) : 0;
  const per100gProtein  = totalWeightG > 0 ? parseFloat(((baseProtein / totalWeightG) * 100).toFixed(1)) : 0;
  const per100gCarbs    = totalWeightG > 0 ? parseFloat(((baseCarbs / totalWeightG) * 100).toFixed(1)) : 0;
  const per100gFat      = totalWeightG > 0 ? parseFloat(((baseFat / totalWeightG) * 100).toFixed(1)) : 0;

  // Active display values based on toggle
  const activeCalories = showPer100g ? per100gCalories : displayCalories;
  const activeProtein  = showPer100g ? per100gProtein  : displayProtein;
  const activeCarbs    = showPer100g ? per100gCarbs    : displayCarbs;
  const activeFat      = showPer100g ? per100gFat      : displayFat;

  // Live junk score
  const liveJunkScore = junkScore !== null
    ? junkScore
    : calculateJunkScore(displayCalories, displayProtein, displayCarbs, displayFat, foodName);

  // Scan Limit
  const userPlan = userData?.selectedPlan || 'Pro';
  const totalAllowedScans = PLAN_SCAN_LIMITS[userPlan] || 10;
  const [dailyScansUsed, setDailyScansUsed] = useState(0);
  const remainingScans = Math.max(totalAllowedScans - dailyScansUsed, 0);

  useEffect(() => {
    const loadDailyScans = async () => {
      try {
        const todayKey = `nutriai_scans_used_${new Date().toISOString().slice(0, 10)}`;
        const stored = await AsyncStorage.getItem(todayKey);
        if (stored !== null) setDailyScansUsed(parseInt(stored, 10) || 0);
      } catch (err) { console.warn('Could not read scan counter:', err); }
    };
    loadDailyScans();
  }, []);

  const incrementScanCount = async () => {
    try {
      const todayKey = `nutriai_scans_used_${new Date().toISOString().slice(0, 10)}`;
      const nextCount = dailyScansUsed + 1;
      setDailyScansUsed(nextCount);
      await AsyncStorage.setItem(todayKey, String(nextCount));
    } catch (err) { console.warn('Could not persist scan counter:', err); }
  };

  // Load Logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMealLogs();
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (e) { console.warn('Could not load meal logs:', e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Photo Picker
  const handleSelectPhoto = async (fromCamera = false) => {
    triggerHaptic('light');
    if (remainingScans <= 0) {
      triggerHaptic('warning');
      Alert.alert('Scan Limit Reached ⚠️', `You have used all ${totalAllowedScans} scans allowed on your ${userPlan} plan today.`);
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
      ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: true, maxWidth: 1024, maxHeight: 1024 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: true, maxWidth: 1024, maxHeight: 1024 });
    if (result.canceled || !result.assets[0]?.uri) return;
    setScannedPhotoUri(result.assets[0].uri);
    setHasAnalysisResult(false);
    triggerHaptic('selection');
  };

  // Analyze with Nia AI
  const handleAnalyzeWithNia = async () => {
    if (!scannedPhotoUri && !foodName.trim()) {
      triggerHaptic('warning');
      Alert.alert('Input Required', 'Please take/upload a photo or type a meal name to analyze.');
      return;
    }
    triggerHaptic('medium');
    setAnalyzing(true);
    setHasAnalysisResult(false);
    setShowPer100g(false);

    try {
      if (scannedPhotoUri) {
        try {
          const analysis = await analyzeMealImage(scannedPhotoUri, 'meal.jpg', 'image/jpeg', portionHint);

          const itemStr = (analysis?.detected_items || '').toLowerCase();
          const isNonFood = itemStr.includes('no food') || itemStr.includes('human') || itemStr.includes('non-food')
            || (analysis?.calories === 0 && analysis?.protein_gm === 0);

          if (isNonFood) {
            triggerHaptic('warning');
            Alert.alert('No Food Detected ⚠️', 'This image does not contain recognizable food. Please upload a clear photo of your meal.');
            setHasAnalysisResult(false);
            return;
          }

          if (analysis && !analysis.error && (analysis.calories > 0 || analysis.protein_gm > 0 || analysis.carbs_gm > 0)) {
            const bc = analysis.calories || 0;
            const bp = analysis.protein_gm || analysis.protein || 0;
            const bca = analysis.carbs_gm || analysis.carbs || 0;
            const bf = analysis.fat_gm || analysis.fat || 0;
            const twg = analysis.total_weight_g || 0;
            const dc = analysis.detected_count || 0;
            const ul = analysis.unit || 'serving';

            setBaseCalories(bc);
            setBaseProtein(bp);
            setBaseCarbs(bca);
            setBaseFat(bf);
            setTotalWeightG(twg);
            setDetectedCount(dc);
            setUnitLabel(ul);
            setIsCountable(dc > 1);
            setEatenCount(dc > 1 ? 1 : 1);
            setPortionFraction(1.0);

            setFoodName(analysis.detected_items || analysis.food_name || foodName || 'Scanned Dish');
            setJunkScore(analysis.junk_score !== undefined && analysis.junk_score !== null ? analysis.junk_score : null);
            setAiInsights(analysis.ai_insights || 'AI analyzed meal composition successfully.');
            setHasAnalysisResult(true);
            incrementScanCount();
            triggerHaptic('success');
            return;
          }

          triggerHaptic('warning');
          Alert.alert('Scan Unsuccessful ℹ️', 'Could not detect food in this photo. Please try again with a clear photo of your dish.');
          setHasAnalysisResult(false);
        } catch (imgErr) {
          triggerHaptic('error');
          console.warn('Image analysis failed:', imgErr.message);
          Alert.alert('Scan Failed ℹ️', 'Could not analyze food image. Please make sure your photo clearly shows a food dish and try again.');
          setHasAnalysisResult(false);
        }
      } else {
        const res = await api.post(ENDPOINTS.niaChat, {
          message: `Analyze this meal: "${foodName.trim()}". Return approximate calories, protein (g), carbs (g), fat (g), and health quality score (0-100).`,
          profile: userData,
        });
        const reply = res.data?.ai_response || res.data?.response || res.data?.message || '';
        setBaseCalories(0); setBaseProtein(0); setBaseCarbs(0); setBaseFat(0);
        setTotalWeightG(0); setDetectedCount(0); setIsCountable(false);
        setAiInsights(reply || 'Meal logged successfully.');
        setHasAnalysisResult(true);
        incrementScanCount();
        triggerHaptic('success');
      }
    } catch (e) {
      triggerHaptic('error');
      Alert.alert('Scan Notice ℹ️', 'Could not complete nutritional analysis. Please check your network and try again.');
      setHasAnalysisResult(false);
    } finally {
      setAnalyzing(false);
    }
  };

  // Auto-Fix Macros (lightweight text call, 0 scan limit cost)
  const handleAutoFix = async () => {
    if (!foodName.trim()) {
      triggerHaptic('warning');
      Alert.alert('Food Name Required', 'Please enter the correct food name first.');
      return;
    }
    triggerHaptic('medium');
    setAutoFixLoading(true);
    try {
      const serving = isCountable && detectedCount > 0
        ? `${detectedCount} ${unitLabel}`
        : portionHint.trim() || '1 serving';
      const res = await api.post(ENDPOINTS.mealAutoFix, { food_name: foodName.trim(), serving });
      const data = res.data;
      if (data && !data.error) {
        setBaseCalories(data.calories || 0);
        setBaseProtein(data.protein_gm || 0);
        setBaseCarbs(data.carbs_gm || 0);
        setBaseFat(data.fat_gm || 0);
        setTotalWeightG(data.total_weight_g || 0);
        setJunkScore(data.junk_score !== undefined ? data.junk_score : null);
        setAiInsights(data.ai_insights || `Macros updated for ${foodName}.`);
        triggerHaptic('success');
      } else {
        triggerHaptic('error');
        Alert.alert('Auto-Fix Failed', 'Could not fetch macros for this food. Please edit manually.');
      }
    } catch (err) {
      triggerHaptic('error');
      Alert.alert('Auto-Fix Error', 'Network error. Please try again or edit macros manually.');
    } finally {
      setAutoFixLoading(false);
    }
  };

  // Manual macro overrides
  const handleManualCaloriesChange = (val) => {
    const n = parseFloat(val) || 0;
    setBaseCalories(displayMultiplier > 0 ? n / displayMultiplier : n);
  };
  const handleManualProteinChange = (val) => {
    const n = parseFloat(val) || 0;
    setBaseProtein(displayMultiplier > 0 ? n / displayMultiplier : n);
  };
  const handleManualCarbsChange = (val) => {
    const n = parseFloat(val) || 0;
    setBaseCarbs(displayMultiplier > 0 ? n / displayMultiplier : n);
  };
  const handleManualFatChange = (val) => {
    const n = parseFloat(val) || 0;
    setBaseFat(displayMultiplier > 0 ? n / displayMultiplier : n);
  };

  // Voice Analysis
  const handleAnalyzeVoice = async () => {
    if (!voiceText.trim()) {
      triggerHaptic('warning');
      Alert.alert('Input Required', 'Please speak or enter what you ate.');
      return;
    }
    triggerHaptic('medium');
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
      triggerHaptic('success');
    } catch (err) {
      setFoodName(voiceText.trim());
      setShowVoiceModal(false);
      setVoiceText('');
    } finally { setAnalyzingVoice(false); }
  };

  // Save Meal Log
  const handleSaveMeal = async () => {
    if (!foodName.trim()) {
      triggerHaptic('warning');
      Alert.alert('Food Name Required', 'Please enter or scan a food name before saving.');
      return;
    }
    triggerHaptic('medium');
    const finalJunk = junkScore !== null && junkScore !== undefined
      ? parseInt(junkScore)
      : calculateJunkScore(displayCalories, displayProtein, displayCarbs, displayFat, foodName.trim());

    const payload = {
      meal_type: mealType || 'Meal',
      meal_location: mealLocation || 'Home',
      detected_items: foodName.trim() || 'Logged Meal',
      calories: Math.round(displayCalories),
      protein_gm: parseFloat(displayProtein.toFixed(2)),
      carbs_gm: parseFloat(displayCarbs.toFixed(2)),
      fat_gm: parseFloat(displayFat.toFixed(2)),
      junk_score: finalJunk,
      ai_insights: aiInsights || 'Nutrient logged successfully.',
      meal_photo_url: scannedPhotoUri && (scannedPhotoUri.startsWith('http://') || scannedPhotoUri.startsWith('https://')) ? scannedPhotoUri : null,
    };

    try {
      const saved = await createMealLog(payload);
      addMealLog({ calories: payload.calories, protein: payload.protein_gm, carbs: payload.carbs_gm, fat: payload.fat_gm, junkScore: finalJunk });
      setLogs((prev) => [saved || payload, ...prev]);
      triggerHaptic('success');
      Alert.alert('Success 🎉', "Meal saved to today's nutrition!");
      resetForm();
    } catch (e) {
      triggerHaptic('error');
      Alert.alert('Error', e?.message || 'Failed to save meal log');
    }
  };

  const handleDeleteMeal = (item) => {
    triggerHaptic('warning');
    Alert.alert(
      'Delete Meal Log 🗑️',
      `Delete "${item.detected_items || item.food_name || 'this meal'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const mealId = item.meal_id || item.id;
            try { if (mealId) await deleteMealLog(mealId); } catch (e) { console.warn('Delete meal API failed:', e?.message); }
            removeMealLog(item);
            setLogs((prev) => prev.filter((m) => (m.meal_id || m.id) !== mealId && m !== item));
            triggerHaptic('light');
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFoodName(''); setJunkScore(null); setAiInsights('');
    setScannedPhotoUri(null); setHasAnalysisResult(false);
    setPortionHint(''); setPortionFraction(1.0);
    setBaseCalories(0); setBaseProtein(0); setBaseCarbs(0); setBaseFat(0);
    setTotalWeightG(0); setDetectedCount(0); setEatenCount(1);
    setUnitLabel('serving'); setIsCountable(false); setShowPer100g(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Meal Logs 🍲</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>AI Vision & Voice Portion Tracking</Text>
          </View>
          <View style={[styles.scanBadge, { backgroundColor: isDark ? 'rgba(30,41,59,0.8)' : '#EFFDF8', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,184,166,0.25)' }]}>
            <Flame size={13} color={COLORS.primary} />
            <Text style={[styles.scanBadgeText, { color: COLORS.primary }]}>{remainingScans} / {totalAllowedScans} left</Text>
          </View>
        </View>

        {/* Meal Logging Card */}
        <View style={[styles.cardContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>

          {/* Photo Frame */}
          <View style={[styles.photoFrame, { borderColor: colors.border, backgroundColor: isDark ? '#0B132B' : '#F4F7FB' }]}>
            {scannedPhotoUri ? (
              <>
                <Image source={{ uri: scannedPhotoUri }} style={styles.photoImg} resizeMode="cover" />
                {analyzing && (
                  <>
                    <Animated.View style={[styles.scanBeam, { transform: [{ translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 160] }) }] }]} />
                    <View style={styles.scanOverlayBanner}>
                      <ActivityIndicator size="small" color="#10B981" />
                      <Text style={styles.scanOverlayText}>{SCAN_STAGES[scanStepIndex]}</Text>
                    </View>
                  </>
                )}
                <Pressable
                  style={styles.removePhotoBtn}
                  onPress={() => {
                    triggerHaptic('light');
                    setScannedPhotoUri(null);
                  }}
                  hitSlop={8}
                >
                  <X size={14} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyPhotoPlaceholder}>
                <View style={[styles.emptyPhotoCircle, { backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.10)' }]}>
                  <Camera size={26} color={COLORS.primary} />
                </View>
                <Text style={[styles.emptyPhotoText, { color: colors.text }]}>Meal Photo Scanner</Text>
                <Text style={[styles.emptyPhotoSub, { color: colors.textMuted }]}>Take a clear dish photo or upload from gallery</Text>
              </View>
            )}
          </View>

          {/* Photo Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => handleSelectPhoto(true)}
              disabled={analyzing}
            >
              <Camera size={16} color="#FFFFFF" />
              <Text style={styles.scanBtnText}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.uploadBtn, { backgroundColor: isDark ? '#0B132B' : '#F1F5F9', borderColor: colors.border }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
              onPress={() => handleSelectPhoto(false)}
              disabled={analyzing}
            >
              <Upload size={16} color={colors.text} />
              <Text style={[styles.uploadBtnText, { color: colors.text }]}>Upload Photo</Text>
            </Pressable>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>

            {/* Pre-scan inputs (hidden after analysis) */}
            {!hasAnalysisResult && (
              <>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Dish / Food Description</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0B132B' : '#F8FAFC' }]}
                  value={foodName}
                  onChangeText={setFoodName}
                  placeholder="e.g. 2 Rotis with Dal & Paneer"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 10 }]}>
                  Portion Hint <Text style={{ color: colors.textMuted, fontWeight: '500' }}>(optional — improves AI accuracy)</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0B132B' : '#F8FAFC' }]}
                  value={portionHint}
                  onChangeText={setPortionHint}
                  placeholder="e.g. 2 pieces, 250g, half plate, 1 bowl"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            {/* Meal Location */}
            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: !hasAnalysisResult ? 12 : 0 }]}>Meal Location</Text>
            <Pressable
              style={[styles.dropdownBtn, { backgroundColor: isDark ? '#0B132B' : '#F8FAFC', borderColor: colors.border }]}
              onPress={() => {
                triggerHaptic('light');
                setShowLocationModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} color={COLORS.primary} />
                <Text style={[styles.dropdownValueText, { color: colors.text }]}>{mealLocation}</Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} />
            </Pressable>

            {/* Meal Type */}
            <Text style={[styles.formLabel, { color: colors.textSecondary, marginTop: 12 }]}>Meal Type</Text>
            <Pressable
              style={[styles.dropdownBtn, { backgroundColor: isDark ? '#0B132B' : '#F8FAFC', borderColor: colors.border }]}
              onPress={() => {
                triggerHaptic('light');
                setShowTypeModal(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Utensils size={15} color={COLORS.primary} />
                <Text style={[styles.dropdownValueText, { color: colors.text }]}>{mealType}</Text>
              </View>
              <ChevronDown size={16} color={colors.textMuted} />
            </Pressable>

            {/* Analyze Button */}
            {!hasAnalysisResult && (
              <Pressable
                style={({ pressed }) => [styles.analyzeBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] }, analyzing && { opacity: 0.7 }]}
                onPress={handleAnalyzeWithNia}
                disabled={analyzing}
              >
                {analyzing ? (
                  <View style={styles.analyzeInner}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.analyzeBtnText}>{SCAN_STAGES[scanStepIndex]}</Text>
                  </View>
                ) : (
                  <View style={styles.analyzeInner}>
                    <Sparkles size={16} color="#FFFFFF" />
                    <Text style={styles.analyzeBtnText}>Analyze with Nia AI ✨</Text>
                  </View>
                )}
              </Pressable>
            )}

            {/* Result Card */}
            {hasAnalysisResult && (
              <View style={[styles.resultsCard, { backgroundColor: isDark ? '#0B132B' : '#F8FAFC', borderColor: colors.border }]}>

                {/* Result Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <CheckCircle2 size={16} color={COLORS.primary} />
                  <Text style={[styles.resultsTitle, { color: colors.text }]}>Nutritional Breakdown</Text>
                  <Pressable
                    style={[styles.resetBtn, { borderColor: colors.border, backgroundColor: colors.bgCard }]}
                    onPress={() => {
                      triggerHaptic('light');
                      resetForm();
                    }}
                    hitSlop={6}
                  >
                    <RotateCcw size={12} color={colors.textMuted} />
                    <Text style={[styles.resetBtnText, { color: colors.textMuted }]}>Re-scan</Text>
                  </Pressable>
                </View>

                {/* Food Name Edit + Auto-Fix */}
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Food Name</Text>
                <View style={styles.foodNameRow}>
                  <TextInput
                    ref={foodNameRef}
                    style={[styles.foodNameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bgCard, flex: 1 }]}
                    value={foodName}
                    onChangeText={setFoodName}
                    placeholder="Edit food name..."
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                  />
                  <Pressable
                    style={[styles.editNameBtn, { borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
                    onPress={() => {
                      triggerHaptic('light');
                      foodNameRef.current?.focus();
                    }}
                    hitSlop={4}
                  >
                    <Edit3 size={14} color={colors.textMuted} />
                  </Pressable>
                  <Pressable
                    style={[styles.autoFixBtn, autoFixLoading && { opacity: 0.7 }]}
                    onPress={handleAutoFix}
                    disabled={autoFixLoading}
                    hitSlop={4}
                  >
                    {autoFixLoading
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <><Sparkles size={11} color="#FFFFFF" /><Text style={styles.autoFixText}>Auto-Fix</Text></>
                    }
                  </Pressable>
                </View>
                <Text style={[styles.autoFixHint, { color: colors.textMuted }]}>
                  ✨ Auto-Fix recalculates macros using AI without deducting your daily scan quota.
                </Text>

                {/* Junk Score Badge */}
                <JunkBadge score={liveJunkScore} />

                {/* Portion Stepper or Chips */}
                {isCountable && detectedCount > 1 ? (
                  <View style={[styles.portionSection, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.portionLabel, { color: colors.textSecondary }]}>
                      How many {unitLabel}s did you eat?
                    </Text>
                    <Text style={[styles.portionSub, { color: colors.textMuted }]}>
                      AI detected ~{detectedCount} {unitLabel}s in the photo
                    </Text>
                    <View style={styles.stepperRow}>
                      <Pressable
                        style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }, eatenCount <= 1 && { opacity: 0.35 }]}
                        onPress={() => {
                          triggerHaptic('light');
                          setEatenCount((c) => Math.max(1, c - 1));
                        }}
                        disabled={eatenCount <= 1}
                        hitSlop={8}
                      >
                        <Text style={[styles.stepperBtnText, { color: colors.text }]}>−</Text>
                      </Pressable>
                      <View style={[styles.stepperValueBox, { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary }]}>
                        <Text style={[styles.stepperValue, { color: COLORS.primary }]}>{eatenCount}</Text>
                        <Text style={[styles.stepperUnit, { color: COLORS.primary }]}>{unitLabel}{eatenCount > 1 ? 's' : ''}</Text>
                      </View>
                      <Pressable
                        style={[styles.stepperBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }, eatenCount >= detectedCount && { opacity: 0.35 }]}
                        onPress={() => {
                          triggerHaptic('light');
                          setEatenCount((c) => Math.min(detectedCount, c + 1));
                        }}
                        disabled={eatenCount >= detectedCount}
                        hitSlop={8}
                      >
                        <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.portionSection, { borderColor: colors.border, backgroundColor: colors.bgCard }]}>
                    <Text style={[styles.portionLabel, { color: colors.textSecondary }]}>How much did you eat?</Text>
                    <View style={styles.chipRow}>
                      {PORTION_CHIPS.map((chip) => {
                        const active = portionFraction === chip.value;
                        return (
                          <Pressable
                            key={chip.label}
                            style={[styles.chip, { borderColor: active ? COLORS.primary : colors.border, backgroundColor: active ? COLORS.primary : (isDark ? '#0B132B' : '#F8FAFC') }]}
                            onPress={() => {
                              triggerHaptic('selection');
                              setPortionFraction(chip.value);
                            }}
                          >
                            <Text style={[styles.chipText, { color: active ? '#FFFFFF' : colors.text }]}>{chip.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Per 100g Toggle */}
                {totalWeightG > 0 && (
                  <View style={styles.toggleRow}>
                    <Pressable
                      style={[styles.toggleBtn, !showPer100g && styles.toggleBtnActive, { borderColor: !showPer100g ? COLORS.primary : colors.border, backgroundColor: !showPer100g ? COLORS.primary : (isDark ? '#0B132B' : '#F8FAFC') }]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setShowPer100g(false);
                      }}
                    >
                      <Text style={[styles.toggleBtnText, { color: !showPer100g ? '#FFFFFF' : colors.textMuted }]}>Your Portion</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.toggleBtn, showPer100g && styles.toggleBtnActive, { borderColor: showPer100g ? COLORS.primary : colors.border, backgroundColor: showPer100g ? COLORS.primary : (isDark ? '#0B132B' : '#F8FAFC') }]}
                      onPress={() => {
                        triggerHaptic('selection');
                        setShowPer100g(true);
                      }}
                    >
                      <Text style={[styles.toggleBtnText, { color: showPer100g ? '#FFFFFF' : colors.textMuted }]}>Per 100g</Text>
                    </Pressable>
                  </View>
                )}
                {showPer100g && totalWeightG > 0 && (
                  <Text style={[styles.per100gNote, { color: colors.textMuted }]}>
                    Based on ~{Math.round(totalWeightG)}g total food visible in photo
                  </Text>
                )}

                {/* Macro Inputs Grid */}
                <View style={styles.macroInputsGrid}>
                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Calories (kcal)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.teal, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={String(activeCalories)}
                      onChangeText={showPer100g ? undefined : handleManualCaloriesChange}
                      keyboardType="numeric"
                      editable={!showPer100g}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Protein (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.protein, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={String(activeProtein)}
                      onChangeText={showPer100g ? undefined : handleManualProteinChange}
                      keyboardType="numeric"
                      editable={!showPer100g}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Carbs (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.carbs, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={String(activeCarbs)}
                      onChangeText={showPer100g ? undefined : handleManualCarbsChange}
                      keyboardType="numeric"
                      editable={!showPer100g}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.macroInputWrap}>
                    <Text style={styles.macroInputLabel}>Fat (g)</Text>
                    <TextInput
                      style={[styles.macroInput, { color: COLORS.fat, borderColor: colors.border, backgroundColor: colors.bgCard }]}
                      value={String(activeFat)}
                      onChangeText={showPer100g ? undefined : handleManualFatChange}
                      keyboardType="numeric"
                      editable={!showPer100g}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {aiInsights ? (
                  <Text style={[styles.aiNoteText, { color: colors.textSecondary }]}>💡 {aiInsights}</Text>
                ) : null}

                {/* Save Button */}
                <Pressable
                  style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}
                  onPress={handleSaveMeal}
                >
                  <Text style={styles.saveBtnText}>Save to Today's Log ✓</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* Today's Logged Meals */}
        <View style={styles.historySection}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>Today's Logged Meals ({logs.length})</Text>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : logs.length === 0 ? (
            <View style={[styles.emptyHistory, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              <Utensils size={32} color={colors.textMuted} />
              <Text style={[styles.emptyHistoryText, { color: colors.text }]}>No meals logged today yet</Text>
              <Text style={[styles.emptyHistorySub, { color: colors.textMuted }]}>Take a photo above to log your breakfast, lunch or snacks</Text>
            </View>
          ) : (
            logs.map((item, i) => (
              <MealLogCard key={item.meal_id || item.id || String(i)} item={item} onDelete={handleDeleteMeal} colors={colors} isDark={isDark} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Location Modal */}
      <Modal visible={showLocationModal} animationType="fade" transparent onRequestClose={() => setShowLocationModal(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowLocationModal(false)}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color={COLORS.primary} />
                <Text style={[modalStyles.title, { color: colors.text }]}>Select Meal Location</Text>
              </View>
              <Pressable onPress={() => setShowLocationModal(false)} hitSlop={8}><X size={18} color={colors.textMuted} /></Pressable>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {MEAL_LOCATIONS.map((loc) => {
                const isSel = mealLocation === loc;
                return (
                  <Pressable
                    key={loc}
                    style={[styles.modalOptionRow, { borderColor: isSel ? COLORS.primary : colors.border, backgroundColor: isSel ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)') : (isDark ? '#0B132B' : '#F8FAFC') }]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setMealLocation(loc);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: isSel ? COLORS.primary : colors.text, fontWeight: isSel ? '800' : '600' }]}>{loc}</Text>
                    {isSel && <Check size={16} color={COLORS.primary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Type Modal */}
      <Modal visible={showTypeModal} animationType="fade" transparent onRequestClose={() => setShowTypeModal(false)}>
        <Pressable style={modalStyles.backdrop} onPress={() => setShowTypeModal(false)}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Utensils size={18} color={COLORS.primary} />
                <Text style={[modalStyles.title, { color: colors.text }]}>Select Meal Type</Text>
              </View>
              <Pressable onPress={() => setShowTypeModal(false)} hitSlop={8}><X size={18} color={colors.textMuted} /></Pressable>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {MEAL_TYPES.map((type) => {
                const isSel = mealType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.modalOptionRow, { borderColor: isSel ? COLORS.primary : colors.border, backgroundColor: isSel ? (isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)') : (isDark ? '#0B132B' : '#F8FAFC') }]}
                    onPress={() => {
                      triggerHaptic('selection');
                      setMealType(type);
                      setShowTypeModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: isSel ? COLORS.primary : colors.text, fontWeight: isSel ? '800' : '600' }]}>{type}</Text>
                    {isSel && <Check size={16} color={COLORS.primary} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Voice Modal */}
      <Modal visible={showVoiceModal} animationType="fade" transparent onRequestClose={() => setShowVoiceModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={modalStyles.header}>
              <View style={modalStyles.micCircle}><Mic size={16} color="#FFFFFF" /></View>
              <Text style={[modalStyles.title, { color: colors.text }]}>Voice Meal Dictation</Text>
              <Pressable onPress={() => setShowVoiceModal(false)} hitSlop={8}><X size={18} color={colors.textMuted} /></Pressable>
            </View>
            <Text style={[modalStyles.sub, { color: colors.textMuted }]}>Speak or write in Bengali, Hindi, or English (e.g. "2 rotis, 1 cup dal, salad"):</Text>
            <TextInput
              style={[modalStyles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#0B132B' : '#F8FAFC' }]}
              value={voiceText}
              onChangeText={setVoiceText}
              placeholder="Type or dictate your meal..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
            <Pressable style={({ pressed }) => [modalStyles.submitBtn, pressed && { opacity: 0.88 }]} onPress={handleAnalyzeVoice} disabled={analyzingVoice}>
              {analyzingVoice
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <><Sparkles size={16} color="#FFFFFF" /><Text style={modalStyles.submitBtnText}>Extract Nutrition with AI →</Text></>
              }
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: SPACING.base, paddingBottom: SPACING['4xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 1 },
  scanBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  scanBadgeText: { fontSize: 11, fontWeight: '800' },

  cardContainer: { borderRadius: RADIUS['2xl'], padding: SPACING.lg, borderWidth: 1, marginBottom: SPACING.lg, ...SHADOWS.sm },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md },
  scanBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: RADIUS.xl, ...SHADOWS.emerald },
  scanBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  uploadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: RADIUS.xl, borderWidth: 1 },
  uploadBtnText: { fontSize: 13, fontWeight: '700' },

  photoFrame: { width: '100%', height: 180, borderRadius: RADIUS.xl, overflow: 'hidden', position: 'relative', marginBottom: SPACING.md, borderWidth: 1 },
  photoImg: { width: '100%', height: '100%' },
  emptyPhotoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.md },
  emptyPhotoCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyPhotoText: { fontSize: 14, fontWeight: '800' },
  emptyPhotoSub: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  scanBeam: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#10B981', shadowColor: '#10B981', shadowRadius: 10, shadowOpacity: 0.9 },
  scanOverlayBanner: { position: 'absolute', bottom: 10, left: 12, right: 12, backgroundColor: 'rgba(15,23,42,0.85)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.lg, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  scanOverlayText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  removePhotoBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.65)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  formSection: { gap: 4 },
  formLabel: { fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { height: 46, borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginTop: 4 },
  dropdownBtn: { height: 48, borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  dropdownValueText: { fontSize: 14, fontWeight: '700' },

  modalOptionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: RADIUS.xl, borderWidth: 1 },
  modalOptionText: { fontSize: 14 },

  analyzeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.teal, paddingVertical: 14, borderRadius: RADIUS.xl, marginTop: 14, ...SHADOWS.emerald },
  analyzeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  analyzeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Result Card
  resultsCard: { borderRadius: RADIUS.xl, padding: SPACING.md, borderWidth: 1, marginTop: SPACING.md },
  resultsTitle: { fontSize: 13, fontWeight: '800', flex: 1, letterSpacing: -0.2 },

  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1 },
  resetBtnText: { fontSize: 10, fontWeight: '700' },

  // Food name edit row
  foodNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 },
  foodNameInput: { height: 42, borderRadius: RADIUS.xl, borderWidth: 1, paddingHorizontal: 12, fontSize: 14, fontWeight: '800' },
  editNameBtn: { width: 38, height: 42, borderRadius: RADIUS.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  autoFixBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#6366F1', paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.xl, height: 42 },
  autoFixText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  autoFixHint: { fontSize: 9.5, lineHeight: 14, marginBottom: 4 },

  // Portion & Stepper
  portionSection: { borderWidth: 1, borderRadius: RADIUS.xl, padding: SPACING.sm, marginTop: 12 },
  portionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  portionSub: { fontSize: 10, marginBottom: 8 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  stepperBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  stepperValueBox: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: RADIUS.xl, borderWidth: 1.5, alignItems: 'center', minWidth: 86 },
  stepperValue: { fontSize: 22, fontWeight: '900' },
  stepperUnit: { fontSize: 10, fontWeight: '700' },

  // Portion fraction chips
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '800' },

  // Per 100g toggle
  toggleRow: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 2 },
  toggleBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.xl, borderWidth: 1, alignItems: 'center' },
  toggleBtnActive: {},
  toggleBtnText: { fontSize: 12, fontWeight: '800' },
  per100gNote: { fontSize: 10, marginBottom: 4 },

  // Macro grid
  macroInputsGrid: { flexDirection: 'row', gap: 6, marginBottom: 10, marginTop: 8 },
  macroInputWrap: { flex: 1 },
  macroInputLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginBottom: 3 },
  macroInput: { height: 38, borderRadius: RADIUS.lg, borderWidth: 1, paddingHorizontal: 6, fontSize: 13, fontWeight: '800', textAlign: 'center' },

  aiNoteText: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 13, borderRadius: RADIUS.xl, alignItems: 'center', ...SHADOWS.emerald },
  saveBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  historySection: { marginTop: SPACING.sm },
  historyTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.md, letterSpacing: -0.3 },
  emptyHistory: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, borderRadius: RADIUS.xl, borderWidth: 1, gap: 6 },
  emptyHistoryText: { fontSize: 14, fontWeight: '800' },
  emptyHistorySub: { fontSize: 12, textAlign: 'center' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(3, 7, 18, 0.75)', justifyContent: 'center', padding: SPACING.lg },
  dialog: { borderRadius: RADIUS['2xl'], padding: SPACING.lg, borderWidth: 1, ...SHADOWS.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  micCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '900', flex: 1, marginLeft: 10 },
  sub: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  textArea: { height: 80, borderRadius: RADIUS.xl, borderWidth: 1, padding: 10, fontSize: 13, textAlignVertical: 'top', marginBottom: 14 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#6366F1', paddingVertical: 13, borderRadius: RADIUS.xl },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
