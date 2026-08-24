// FILE: mobile/src/components/dashboard/WaterTracker.js
// Purpose: Interactive water intake tracker with Add & Minus options, proper spacing, and dark mode support

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Droplets, Plus, Minus } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';

const ADD_INCREMENTS = [0.25, 0.5, 0.75, 1.0];
const SUB_INCREMENTS = [-0.25, -0.5];

export default function WaterTracker({ current = 0, goal = 3.0, onAdd }) {
  const { isDark, colors } = useTheme();

  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const glasses = Math.round(current / 0.25);
  const totalGlasses = Math.round(goal / 0.25);

  const handleMinus = () => {
    if (current > 0 && onAdd) {
      triggerHaptic('light');
      onAdd(-0.25);
    }
  };

  const handleAdd = (val = 0.25) => {
    if (onAdd) {
      triggerHaptic('medium');
      onAdd(val);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.06)', borderColor: isDark ? 'rgba(14, 165, 233, 0.25)' : 'rgba(14, 165, 233, 0.20)' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.20)' : 'rgba(14, 165, 233, 0.15)' }]}>
            <Droplets size={16} color={COLORS.water} />
          </View>
          <Text style={[styles.title, { color: isDark ? '#38BDF8' : '#0284C7' }]}>Water Intake</Text>
        </View>

        {/* Stepper and Current Amount */}
        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [
              styles.quickMinusBtn,
              { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)', borderColor: isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.25)' },
              current <= 0 && { opacity: 0.35 },
              pressed && current > 0 && { opacity: 0.75 },
            ]}
            onPress={handleMinus}
            disabled={current <= 0}
            hitSlop={6}
          >
            <Minus size={13} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.5} />
          </Pressable>

          <Text style={styles.amount}>
            <Text style={[styles.amountBold, { color: isDark ? '#38BDF8' : '#0284C7' }]}>{current.toFixed(1)}</Text>
            <Text style={[styles.amountGoal, { color: colors.textMuted }]}> / {goal}L</Text>
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.quickAddBtn,
              { backgroundColor: COLORS.water },
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => handleAdd(0.25)}
            hitSlop={6}
          >
            <Plus size={13} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Wave progress bar */}
      <View style={[styles.track, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)' }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: COLORS.water }]} />
        <Text style={[styles.pctText, pct > 40 ? styles.pctTextInverse : { color: isDark ? '#38BDF8' : '#0284C7' }]}>
          {Math.round(pct)}%
        </Text>
      </View>

      {/* Glasses visual */}
      <View style={styles.glassesRow}>
        {Array.from({ length: Math.min(totalGlasses, 12) }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.glassDot,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(14, 165, 233, 0.18)' },
              i < glasses && { backgroundColor: COLORS.water },
            ]}
          />
        ))}
        {totalGlasses > 12 && (
          <Text style={[styles.moreText, { color: colors.textMuted }]}>+{totalGlasses - 12}</Text>
        )}
      </View>

      {/* Quick Add & Minus Actions Row */}
      <View style={styles.actionSection}>
        {/* Quick Add buttons */}
        <View style={styles.addRow}>
          {ADD_INCREMENTS.map((amt) => (
            <Pressable
              key={amt}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: isDark ? '#0f172a' : '#DBEAFE', borderColor: isDark ? '#334155' : '#BFDBFE' },
                pressed && styles.btnPressed,
              ]}
              onPress={() => onAdd && onAdd(amt)}
            >
              <Plus size={11} color={COLORS.water} />
              <Text style={[styles.addBtnText, { color: isDark ? '#60A5FA' : '#1D4ED8' }]}>{amt}L</Text>
            </Pressable>
          ))}
        </View>

        {/* Minus Quick Actions (if current > 0) */}
        {current > 0 && (
          <View style={styles.minusRow}>
            {SUB_INCREMENTS.map((amt) => (
              <Pressable
                key={amt}
                style={({ pressed }) => [
                  styles.minusBtn,
                  { backgroundColor: isDark ? '#450a0a' : '#FEF2F2', borderColor: isDark ? '#7f1d1d' : '#FECACA' },
                  pressed && styles.btnPressed,
                ]}
                onPress={() => onAdd && onAdd(amt)}
              >
                <Minus size={10} color="#EF4444" />
                <Text style={styles.minusBtnText}>{Math.abs(amt)}L</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickMinusBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
  },
  amount: {
    fontSize: FONT_SIZES.base,
  },
  amountBold: {
    fontWeight: '900',
    fontSize: FONT_SIZES.lg,
  },
  amountGoal: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  track: {
    height: 18,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.sm,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.water,
    borderRadius: RADIUS.full,
  },
  pctText: {
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  pctTextInverse: {
    color: '#ffffff',
  },
  glassesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: SPACING.md,
  },
  glassDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  glassDotFilled: {
    backgroundColor: COLORS.water,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 2,
  },
  actionSection: {
    gap: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 6,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  minusRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
  },
  minusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  minusBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
  },
  btnPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
