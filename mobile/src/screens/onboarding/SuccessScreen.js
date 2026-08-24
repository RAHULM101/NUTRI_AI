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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../../constants/theme';

const HIGHLIGHTS = [
  { icon: Target, label: 'Personalized calorie targets' },
  { icon: Sparkles, label: 'AI meal plan ready' },
  { icon: Leaf, label: 'Smart nutrition tracking' },
];

export default function SuccessScreen({ navigation }) {
  const { loadUserProfile } = useAuth();
  const { isDark, colors } = useTheme();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={styles.container}>
        {/* Success icon */}
        <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)', borderColor: isDark ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.25)' }]}>
            <CheckCircle2 size={52} color={COLORS.primary} strokeWidth={2} />
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>You're All Set! 🎉</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Your personalized nutrition profile has been created and customized.
          </Text>

          <View style={styles.highlights}>
            {HIGHLIGHTS.map((h, i) => {
              const Icon = h.icon;
              return (
                <View key={i} style={[styles.highlight, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <View style={[styles.highlightIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)' }]}>
                    <Icon size={18} color={COLORS.primary} />
                  </View>
                  <Text style={[styles.highlightText, { color: colors.textSecondary }]}>{h.label}</Text>
                </View>
              );
            })}
          </View>

          <Button
            title="Go to Dashboard 🚀"
            onPress={handleGoDashboard}
            size="lg"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  iconWrap: { marginBottom: SPACING['2xl'] },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: { alignItems: 'center', width: '100%' },
  title: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING['2xl'],
  },
  highlights: { width: '100%', gap: SPACING.sm, marginBottom: SPACING['2xl'] },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    gap: SPACING.md,
    borderWidth: 1,
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
});
