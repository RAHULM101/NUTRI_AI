// FILE: mobile/src/screens/auth/LandingScreen.js
// Premium full-screen hero landing — NutriAI logo, Unsplash food spread, glassmorphism overlays, pitch dark obsidian mode support

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  StatusBar,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Bot, Target, Sparkles, Camera, Sun, Moon, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const FOOD_BG = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=85';
const MEAL_MOCKUP = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=85';

const FEATURES = [
  { icon: Zap, label: 'Instant Scan', color: '#F59E0B' },
  { icon: Bot, label: 'AI Coach', color: '#8B5CF6' },
  { icon: Target, label: 'Smart Goals', color: '#10B981' },
  { icon: Camera, label: 'Nutrient Insights', color: '#0EA5E9' },
];

export default function LandingScreen({ navigation }) {
  const { isDark, toggleTheme, colors } = useTheme();

  // Staggered entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const mockAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      ]),
      Animated.timing(mockAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#030712' : '#0f172a' }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full Screen Food Background Image */}
      <Image
        source={{ uri: FOOD_BG }}
        style={styles.heroBg}
        resizeMode="cover"
      />

      {/* Deep Obsidian Dark Mode Overlay for crisp text contrast */}
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? 'rgba(3, 7, 18, 0.95)'
              : 'rgba(15, 23, 42, 0.68)',
          },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top Navbar */}
        <View style={styles.navbar}>
          <Animated.View style={{ transform: [{ scale: logoScale }] }}>
            <Image
              source={require('../../../assets/nutriai-logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </Animated.View>

          <Pressable
            style={({ pressed }) => [styles.themeBtn, pressed && { opacity: 0.8 }]}
            onPress={toggleTheme}
          >
            {isDark ? (
              <Sun size={18} color="#FBBF24" />
            ) : (
              <Moon size={18} color="#6366F1" />
            )}
            <Text style={styles.themeBtnText}>{isDark ? 'Light' : 'Dark'}</Text>
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Hero Content */}
          <Animated.View
            style={[
              styles.heroContent,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* AI Badge */}
            <View style={styles.badge}>
              <Sparkles size={13} color="#10B981" />
              <Text style={styles.badgeText}>AI-POWERED NUTRITION</Text>
            </View>

            <Text style={styles.title}>
              Master Your{'\n'}
              <Text style={{ color: '#10B981' }}>Nutrition</Text> with AI
            </Text>

            <Text style={styles.subtitle}>
              Instant meal scanning • Accurate nutrition insights • Personalized guidance by your AI coach
            </Text>

            {/* Phone Mockup */}
            <Animated.View style={[styles.mockupContainer, { opacity: mockAnim }]}>
              <View style={styles.mockupFrame}>
                <Image source={{ uri: MEAL_MOCKUP }} style={styles.mockupImg} resizeMode="cover" />
                <View style={styles.scanLine} />
                <View style={styles.mockupBadge}>
                  <Camera size={12} color="#ffffff" />
                  <Text style={styles.mockupBadgeText}>AI Scanning 485 kcal</Text>
                </View>
              </View>
            </Animated.View>

            {/* Feature Chips Grid */}
            <View style={styles.featuresRow}>
              {FEATURES.map(({ icon: Icon, label, color }) => (
                <View key={label} style={styles.featureChip}>
                  <Icon size={12} color={color} />
                  <Text style={styles.featureChipText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* CTA Buttons */}
            <View style={styles.ctaRow}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
                onPress={() => navigation.navigate('Signup')}
              >
                <Text style={styles.primaryBtnText}>Sign Up Free</Text>
                <ArrowRight size={16} color="#fff" />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.secondaryBtnText}>Log In</Text>
              </Pressable>
            </View>

            <Text style={styles.termsText}>
              By continuing you agree to NutriAI Terms & Privacy Policy
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#030712' },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  safe: { flex: 1 },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  logoImg: { height: 38, width: 140, tintColor: '#ffffff' },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  themeBtnText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: '#ffffff' },

  scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING['3xl'], paddingTop: SPACING.md },
  heroContent: { alignItems: 'flex-start' },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16,185,129,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
    marginBottom: SPACING.base,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#34D399', letterSpacing: 0.8 },

  // Typography
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 23,
    marginBottom: SPACING.xl,
  },

  // Mockup
  mockupContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  mockupFrame: {
    width: width * 0.82,
    height: 180,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    ...SHADOWS.lg,
    position: 'relative',
  },
  mockupImg: { width: '100%', height: '100%' },
  scanLine: {
    position: 'absolute',
    top: '48%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#34D399',
    shadowColor: '#34D399',
    shadowRadius: 8,
    shadowOpacity: 0.9,
  },
  mockupBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mockupBadgeText: { fontSize: 11, color: '#ffffff', fontWeight: '700' },

  // Features chips
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING['2xl'],
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  featureChipText: { fontSize: 12, fontWeight: '700', color: '#f8fafc' },

  // CTA
  ctaRow: { width: '100%', gap: SPACING.md, marginBottom: SPACING.base },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    ...SHADOWS.emerald,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: RADIUS.xl,
    paddingVertical: 15,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: '#ffffff', fontSize: FONT_SIZES.md, fontWeight: '800' },
  secondaryBtnText: { color: '#ffffff', fontSize: FONT_SIZES.md, fontWeight: '700' },

  termsText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', width: '100%' },
});
