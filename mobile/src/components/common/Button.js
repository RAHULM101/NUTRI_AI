// FILE: mobile/src/components/common/Button.js
// Purpose: Reusable styled button — primary, outline, ghost variants
// Mobile adaptation: Pressable with press-in animation (replaces web hover)

import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, RADIUS, SHADOWS, FONT_SIZES, SPACING } from '../../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'outline' | 'ghost' | 'danger'
  size = 'md',          // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  style,
  textStyle,
  fullWidth = true,
}) {
  const getContainerStyle = () => {
    const base = [styles.base, styles[size]];
    if (variant === 'primary') base.push(styles.primary);
    if (variant === 'outline') base.push(styles.outline);
    if (variant === 'ghost') base.push(styles.ghost);
    if (variant === 'danger') base.push(styles.danger);
    if (fullWidth) base.push(styles.fullWidth);
    if (disabled || loading) base.push(styles.disabled);
    if (style) base.push(style);
    return base;
  };

  const getTextStyle = () => {
    const base = [styles.text, styles[`text_${size}`]];
    if (variant === 'outline') base.push(styles.textOutline);
    if (variant === 'ghost') base.push(styles.textGhost);
    if (variant === 'danger') base.push(styles.textDanger);
    if (textStyle) base.push(textStyle);
    return base;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        ...getContainerStyle(),
        pressed && !disabled && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.primary} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fullWidth: { width: '100%' },

  // Sizes
  sm: { paddingVertical: 10, paddingHorizontal: SPACING.md },
  md: { paddingVertical: 14, paddingHorizontal: SPACING.lg },
  lg: { paddingVertical: 18, paddingHorizontal: SPACING.xl },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.emerald,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  danger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.sm,
  },

  // Press state
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },

  // Text
  text: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  text_sm: { fontSize: FONT_SIZES.sm },
  text_md: { fontSize: FONT_SIZES.base },
  text_lg: { fontSize: FONT_SIZES.md },
  textOutline: { color: COLORS.primary },
  textGhost: { color: COLORS.primary },
  textDanger: { color: '#ffffff' },

  // Icon helpers
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconLeft: { marginRight: 4 },
  iconRight: { marginLeft: 4 },
});
