import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FONT_SIZES, RADIUS } from '../../constants/theme';

export default function MacroBar({ label, current, goal, color, unit = 'g' }) {
  const { isDark, colors } = useTheme();
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
        </View>
        <View style={styles.valGroup}>
          <Text style={[styles.value, { color }]}>
            {Math.round(current)}
            <Text style={[styles.unit, { color: colors.textMuted }]}> / {Math.round(goal)}{unit}</Text>
          </Text>
        </View>
      </View>
      <View style={[styles.track, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.05)' }]}>
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
  container: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  valGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  unit: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 4,
  },
});
