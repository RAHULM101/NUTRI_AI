// FILE: mobile/src/screens/main/DashboardScreen.js
// Modern dashboard — Dynamic greeting, error state on API fail, Dark mode polish

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, TrendingDown, TrendingUp, Zap, Trophy, ChevronRight, Sun, Moon, BarChart2, Sparkles, WifiOff, Utensils } from 'lucide-react-native';
import CalorieRing from '../../components/dashboard/CalorieRing';
import MacroBar from '../../components/dashboard/MacroBar';
import WaterTracker from '../../components/dashboard/WaterTracker';
import WeeklyReportModal from '../../components/dashboard/WeeklyReportModal';
import AnalyticsModal from '../../components/dashboard/AnalyticsModal';
import SubscriptionModal from '../../components/common/SubscriptionModal';
import { DashboardSkeleton } from '../../components/common/SkeletonLoader';
import { triggerHaptic } from '../../utils/haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDashboardData } from '../../services/mealService';
import { useFocusEffect } from '@react-navigation/native';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { calculateDailyCalorieTarget, calculateMacros } from '../../utils/calorieCalculator';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

// ── Dynamic greeting (recomputed every render, updated every minute) ──
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

function StatCard({ icon: Icon, label, value, color, bg, labelColor }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: labelColor || COLORS.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { userData, userMetrics, dailyLogs, setDailyLogs, updateWaterIntake, loadUserProfile } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [dashError, setDashError] = useState(false);

  // ── Dynamic greeting — updates every minute ───────────────────
  const [greeting, setGreeting] = useState(getGreeting());
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const firstName = userData?.firstName || userData?.name?.split(' ')[0] || 'there';
  const calGoal = calculateDailyCalorieTarget(userData, userMetrics);
  const waterGoal = parseFloat(userData?.waterGoal || userMetrics?.water_goal) || 3.0;
  
  // Directly sync with backend daily aggregates on reload & keep reactive with local state
  const currentCal = dashData?.today?.calories !== undefined ? dashData.today.calories : (dailyLogs?.daily_calories_consumed || 0);
  const currentWater = dashData?.today?.water !== undefined ? dashData.today.water : (dailyLogs?.current_water || 0);
  const protein = dashData?.today?.protein !== undefined ? dashData.today.protein : (dailyLogs?.daily_protein || 0);
  const carbs = dashData?.today?.carbs !== undefined ? dashData.today.carbs : (dailyLogs?.daily_carbs || 0);
  const fat = dashData?.today?.fat !== undefined ? dashData.today.fat : (dailyLogs?.daily_fat || 0);
  const junkScore = dashData?.today?.junk_score !== undefined ? dashData.today.junk_score : (dailyLogs?.junk_score || 0);
  const profilePct = getProfileCompletion(userData);

  const { proteinGoal, carbsGoal, fatGoal } = calculateMacros(calGoal);

  const loadDashboard = useCallback(async () => {
    try {
      setDashError(false);
      const data = await getDashboardData();
      setDashData(data);
      if (data?.today) {
        setDailyLogs((prev) => ({
          ...prev,
          current_water: data.today.water !== undefined ? data.today.water : prev.current_water,
          daily_calories_consumed: data.today.calories !== undefined ? data.today.calories : prev.daily_calories_consumed,
          daily_protein: data.today.protein !== undefined ? data.today.protein : prev.daily_protein,
          daily_carbs: data.today.carbs !== undefined ? data.today.carbs : prev.daily_carbs,
          daily_fat: data.today.fat !== undefined ? data.today.fat : prev.daily_fat,
          junk_score: data.today.junk_score !== undefined ? data.today.junk_score : prev.junk_score,
        }));
      }
    } catch (e) {
      console.warn('Dashboard load failed:', e?.message);
      setDashError(true);
    } finally {
      setLoading(false);
    }
  }, [setDailyLogs]);

  const handleUpdateWater = async (amount) => {
    const next = Math.max(0, parseFloat((currentWater + amount).toFixed(2)));
    setDashData((prev) => ({
      ...prev,
      today: {
        ...(prev?.today || {}),
        water: next,
      },
    }));
    await updateWaterIntake(amount);
  };

  useFocusEffect(
    useCallback(() => {
      loadUserProfile().catch(() => {});
      loadDashboard();
    }, [loadUserProfile, loadDashboard])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const streak = dashData?.streak || 0;
  const avgJunk = dashData?.today?.junk_score !== undefined ? dashData.today.junk_score : junkScore;

  // Standardized Junk Score Color Logic (Red >60, Yellow 31-60, Green 0-30)
  const junkColor = avgJunk > 60 ? '#EF4444' : avgJunk > 30 ? '#F59E0B' : '#10B981';
  const junkBg = avgJunk > 60
    ? (isDark ? '#450a0a' : '#FEF2F2')
    : avgJunk > 30
    ? (isDark ? '#451a03' : '#FFFBEB')
    : (isDark ? '#064e3b' : '#ECFDF5');

  if (loading && !dashData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('../../../assets/nutriai-logo.png')}
              style={[styles.headerLogo, isDark && { tintColor: '#ffffff' }]}
              resizeMode="contain"
            />
          </View>

          {/* Action Buttons: Trends, Report, Upgrade, Theme */}
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.analyticsBtn, { backgroundColor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.10)', borderColor: isDark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.25)' }, pressed && { opacity: 0.8 }]}
              onPress={() => setShowAnalytics(true)}
              hitSlop={4}
            >
              <TrendingUp size={13} color="#6366F1" />
              <Text style={styles.analyticsBtnText}>Trends</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.reportBtn, { backgroundColor: isDark ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.12)', borderColor: isDark ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.25)' }, pressed && { opacity: 0.8 }]}
              onPress={() => setShowReport(true)}
              hitSlop={4}
            >
              <BarChart2 size={13} color={COLORS.primary} />
              <Text style={styles.reportBtnText}>Report</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.upgradeBtn, pressed && { opacity: 0.8 }]}
              onPress={() => setShowSubscription(true)}
              hitSlop={4}
            >
              <Sparkles size={11} color="#ffffff" />
              <Text style={styles.upgradeBtnText}>PRO</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
              onPress={toggleTheme}
              hitSlop={6}
            >
              {isDark ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#6366F1" />}
            </Pressable>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Greeting */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting} 👋</Text>
              <Text style={[styles.name, { color: colors.text }]}>{firstName}</Text>
            </View>

            {streak > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: isDark ? '#451a03' : '#FFFBEB', borderColor: isDark ? '#78350f' : '#FDE68A' }]}>
                <Flame size={14} color="#F59E0B" />
                <Text style={styles.streakText}>{streak}d streak</Text>
              </View>
            )}
          </View>

          {/* API Error Banner */}
          {dashError && (
            <Pressable
              style={[styles.errorBanner, { backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' }]}
              onPress={loadDashboard}
            >
              <WifiOff size={14} color="#EF4444" />
              <Text style={styles.errorBannerText}>Could not load dashboard data. Tap to retry.</Text>
            </Pressable>
          )}

          {/* Profile completion banner */}
          {profilePct < 100 && (
            <Pressable
              style={[styles.completionBanner, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.completionBarTrack, { backgroundColor: isDark ? '#334155' : '#E8F5F1' }]}>
                <View style={[styles.completionBarFill, { width: `${profilePct}%` }]} />
              </View>
              <View style={styles.completionRow}>
                <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                  Complete your profile — {profilePct}% done
                </Text>
                <ChevronRight size={14} color={COLORS.primary} />
              </View>
            </Pressable>
          )}

          {/* Calorie ring + macros (Fixed Spacing & Dark mode contrast) */}
          <View style={[styles.calorieSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <CalorieRing current={currentCal} goal={calGoal} size={180} />
            <View style={styles.macrosSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Macros</Text>
              <MacroBar label="Protein" current={protein} goal={proteinGoal} color={COLORS.protein} />
              <MacroBar label="Carbs" current={carbs} goal={carbsGoal} color={COLORS.carbs} />
              <MacroBar label="Fat" current={fat} goal={fatGoal} color={COLORS.fat} />
            </View>
          </View>

          {/* Quick stats (Standardized Junk Score color logic) */}
          <View style={styles.statsRow}>
            <StatCard
              icon={Utensils}
              label="Meals Logged"
              value={`${dashData?.today?.meals_count !== undefined ? dashData.today.meals_count : (currentCal > 0 ? 1 : 0)}`}
              color={COLORS.teal}
              bg={isDark ? '#0f172a' : '#EFF9F8'}
              labelColor={colors.textMuted}
            />
            <StatCard
              icon={TrendingDown}
              label="Junk Score"
              value={`${Math.round(avgJunk)}/100`}
              color={junkColor}
              bg={junkBg}
              labelColor={colors.textMuted}
            />
            <StatCard
              icon={Trophy}
              label="Streak"
              value={`${streak}d`}
              color="#F59E0B"
              bg={isDark ? '#451a03' : '#FFFBEB'}
              labelColor={colors.textMuted}
            />
          </View>

          {/* Hydration Tracker */}
          <View style={styles.section}>
            <WaterTracker
              current={currentWater}
              goal={waterGoal}
              onAdd={handleUpdateWater}
            />
          </View>

          {/* Quick log CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.quickLogBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
              pressed && styles.quickLogBtnPressed,
            ]}
            onPress={() => navigation.navigate('MealLogs')}
          >
            <View style={styles.quickLogLeft}>
              <View style={styles.quickLogIconWrap}>
                <Flame size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.quickLogTitle, { color: colors.text }]}>Log a Meal</Text>
                <Text style={[styles.quickLogSub, { color: colors.textMuted }]}>Track nutrition with AI photo scan</Text>
              </View>
            </View>
            <ChevronRight size={20} color={COLORS.primary} />
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Weekly Report Modal */}
      <WeeklyReportModal
        visible={showReport}
        onClose={() => setShowReport(false)}
        dashData={dashData}
        userData={userData}
      />

      {/* Analytics & Graph Trends Modal */}
      <AnalyticsModal
        visible={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        dashData={dashData}
        userData={userData}
        userMetrics={userMetrics}
      />

      {/* Direct Subscription Modal */}
      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
        userData={userData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: SPACING.base, paddingBottom: SPACING['3xl'] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerLeft: { flexShrink: 0 },
  headerLogo: { width: 90, height: 26 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },

  analyticsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  analyticsBtnText: { fontSize: 10, fontWeight: '800', color: '#6366F1' },

  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  reportBtnText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },

  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  upgradeBtnText: { fontSize: 10, fontWeight: '900', color: '#ffffff', letterSpacing: 0.5 },

  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
  },
  greeting: { fontSize: FONT_SIZES.sm, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },

  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  streakText: { fontSize: 12, fontWeight: '800', color: '#D97706' },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    borderWidth: 1,
  },
  errorBannerText: { fontSize: 12, fontWeight: '600', color: '#EF4444', flex: 1 },

  // Completion banner
  completionBanner: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  completionBarTrack: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completionBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  completionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completionText: { fontSize: 12, fontWeight: '600' },

  // Calorie ring
  calorieSection: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.base,
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  macrosSection: { width: '100%', marginTop: SPACING.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.sm },

  // Stats row
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statCard: { flex: 1, borderRadius: RADIUS.xl, padding: SPACING.md, alignItems: 'center' },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  section: { marginBottom: SPACING.base },

  // Quick log
  quickLogBtn: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  quickLogBtnPressed: { opacity: 0.88 },
  quickLogLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  quickLogIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.emerald,
  },
  quickLogTitle: { fontSize: 16, fontWeight: '800' },
  quickLogSub: { fontSize: 12, marginTop: 2 },
});
