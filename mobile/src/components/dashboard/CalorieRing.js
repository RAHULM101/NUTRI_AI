// FILE: mobile/src/components/dashboard/CalorieRing.js
// Purpose: Circular SVG progress ring showing daily calorie progress with fixed spacing and dark mode support

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES } from '../../constants/theme';

export default function CalorieRing({ current = 0, goal = 2000, size = 180 }) {
  const { isDark, colors } = useTheme();

  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const dashOffset = circumference * (1 - pct);

  const remaining = Math.max(goal - current, 0);
  const overGoal = current > goal;

  return (
    <View style={[styles.wrapper, { width: size + 8, height: size + 8 }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="calGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.primary} />
            <Stop offset="1" stopColor={COLORS.teal} />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? '#334155' : '#E2E8F0'}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={overGoal ? '#EF4444' : 'url(#calGrad)'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center text aligned cleanly without clipping */}
      <View style={styles.center}>
        <Text style={[styles.calValue, { color: overGoal ? '#EF4444' : colors.text }]}>
          {Math.round(current)}
        </Text>
        <Text style={[styles.calLabel, { color: colors.textMuted }]}>kcal</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.remaining, { color: colors.textSecondary }]}>
          {overGoal ? `+${Math.round(current - goal)}` : Math.round(remaining)} remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calValue: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  calLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    width: 32,
    height: 1.5,
    marginVertical: 6,
  },
  remaining: {
    fontSize: 11,
    fontWeight: '700',
  },
});
