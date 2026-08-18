// FILE: mobile/src/components/common/Card.js
// Purpose: Container card with glassmorphic or clean styling
// Design: Matches web's rounded-3xl shadow cards

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../constants/theme';

export default function Card({ children, style, variant = 'default', padding = true }) {
  return (
    <View
      style={[
        styles.base,
        variant === 'glass' && styles.glass,
        variant === 'elevated' && styles.elevated,
        variant === 'outlined' && styles.outlined,
        padding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: RADIUS['2xl'],
    ...SHADOWS.md,
  },
  padding: {
    padding: SPACING.base,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...SHADOWS.lg,
  },
  elevated: {
    backgroundColor: COLORS.surfaceLight,
    ...SHADOWS.lg,
  },
  outlined: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowOpacity: 0,
    elevation: 0,
  },
});
