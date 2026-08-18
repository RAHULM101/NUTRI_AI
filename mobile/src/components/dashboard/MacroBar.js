// FILE: mobile/src/components/dashboard/MacroBar.js
// Purpose: Horizontal progress bar for Protein/Carbs/Fat macros
// Mobile adaptation: View-based progress bar (replaces Recharts)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, RADIUS, SPACING } from '../../constants/theme';

export default function MacroBar({ label, current, goal, color, unit = 'g' }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color }]}>
          {Math.round(current)}
          <Text style={styles.unit}>/{Math.round(goal)}{unit}</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
  unit: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: COLORS.textMuted,
  },
  track: {
    height: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 4,
  },
});
