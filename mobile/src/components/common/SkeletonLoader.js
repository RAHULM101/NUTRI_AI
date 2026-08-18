// FILE: mobile/src/components/common/SkeletonLoader.js
// Purpose: Smooth animated skeleton shimmer placeholders for Dashboard, Store, and Profile

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { RADIUS } from '../../constants/theme';

export function SkeletonBox({ width = '100%', height = 20, borderRadius = RADIUS.md, style }) {
  const { isDark } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim]);

  const baseBg = isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseBg,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.skeletonWrap, { backgroundColor: colors.bg }]}>
      {/* Header skeleton */}
      <View style={styles.rowBetween}>
        <View style={{ gap: 6 }}>
          <SkeletonBox width={120} height={14} />
          <SkeletonBox width={180} height={24} borderRadius={RADIUS.lg} />
        </View>
        <SkeletonBox width={40} height={40} borderRadius={RADIUS.full} />
      </View>

      {/* Hero Calorie Ring Skeleton */}
      <View style={[styles.heroCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={styles.centerCol}>
          <SkeletonBox width={160} height={160} borderRadius={80} />
          <View style={{ height: 16 }} />
          <SkeletonBox width={140} height={16} />
        </View>
      </View>

      {/* Macro Bars Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <SkeletonBox width={100} height={16} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={10} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={10} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={10} />
      </View>

      {/* Water Tracker Skeleton */}
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <SkeletonBox width={120} height={18} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={48} borderRadius={RADIUS.xl} />
      </View>
    </View>
  );
}

export function StoreSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.skeletonWrap, { backgroundColor: colors.bg }]}>
      {/* Search Bar Skeleton */}
      <SkeletonBox width="100%" height={48} borderRadius={RADIUS.xl} style={{ marginBottom: 16 }} />

      {/* Categories Row */}
      <View style={styles.rowGap}>
        <SkeletonBox width={70} height={32} borderRadius={RADIUS.full} />
        <SkeletonBox width={90} height={32} borderRadius={RADIUS.full} />
        <SkeletonBox width={80} height={32} borderRadius={RADIUS.full} />
        <SkeletonBox width={75} height={32} borderRadius={RADIUS.full} />
      </View>

      {/* Product Grid Skeleton */}
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.gridCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <SkeletonBox width="100%" height={120} borderRadius={RADIUS.lg} style={{ marginBottom: 8 }} />
            <SkeletonBox width="80%" height={14} style={{ marginBottom: 6 }} />
            <SkeletonBox width="40%" height={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: { flex: 1, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rowGap: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  centerCol: { alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 12,
  },
});
