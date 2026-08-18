// FILE: mobile/src/screens/onboarding/SuccessScreen.js
// Purpose: Animated onboarding completion screen
// Converted from: web's SuccessScreen.jsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Sparkles, Target, Leaf } from 'lucide-react-native';
import Button from '../../components/common/Button';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const HIGHLIGHTS = [
  { icon: Target, label: 'Personalized calorie targets' },
  { icon: Sparkles, label: 'AI meal plan ready' },
  { icon: Leaf, label: 'Smart nutrition tracking' },
];

export default function SuccessScreen({ navigation }) {
  const { loadUserProfile } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Pre-fetch profile in background
    loadUserProfile().catch(() => {});
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleGoDashboard = async () => {
    await loadUserProfile().catch(() => {});
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* Success icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={52} color={COLORS.primary} strokeWidth={2} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>You're all set</Text>
          <Text style={styles.subtitle}>
            Your personalized NutriAI profile has been created. Let's start your health journey!
          </Text>

          {/* Highlights */}
          <View style={styles.highlights}>
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.highlight}>
                <View style={styles.highlightIcon}>
                  <Icon size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.highlightText}>{label}</Text>
              </View>
            ))}
          </View>

          <Button
            title="Go to Dashboard"
            onPress={handleGoDashboard}
            size="lg"
            style={styles.btn}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  iconWrap: { marginBottom: SPACING['2xl'] },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(16,185,129,0.2)',
  },
  content: { alignItems: 'center', width: '100%' },
  title: {
    fontSize: FONT_SIZES['3xl'], fontWeight: '800',
    color: COLORS.textPrimary, textAlign: 'center',
    marginBottom: SPACING.sm, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.base, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 24, marginBottom: SPACING['2xl'],
  },
  highlights: { width: '100%', gap: SPACING.sm, marginBottom: SPACING['2xl'] },
  highlight: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.surfaceMuted, borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  highlightIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  highlightText: { fontSize: FONT_SIZES.base, fontWeight: '600', color: COLORS.textPrimary },
  btn: { width: '100%' },
});
