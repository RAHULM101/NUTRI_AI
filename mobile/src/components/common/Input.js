// FILE: mobile/src/components/common/Input.js
// Modern input component — animated focus ring, proper icon alignment, clean design

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Animated } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS, RADIUS, FONT_SIZES, SPACING } from '../../constants/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  leftIcon = null,
  errorMsg = '',
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  onSubmitEditing,
  returnKeyType = 'next',
  ...props
}) {
  const [focused, setFocused]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const bgAnim     = useRef(new Animated.Value(0)).current;

  const isPassword = secureTextEntry;

  const onFocus = () => {
    setFocused(true);
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim,     { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const onBlur = () => {
    setFocused(false);
    Animated.parallel([
      Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(bgAnim,     { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      errorMsg ? COLORS.error : '#D1D9E6',
      errorMsg ? COLORS.error : COLORS.primary,
    ],
  });

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#FAFFFE'],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor },
          !editable && styles.inputDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            isPassword && styles.inputWithRight,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0BBC8"
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          {...props}
        />

        {isPassword && (
          <Pressable style={styles.rightIcon} onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
            {showPassword
              ? <EyeOff size={18} color={COLORS.textMuted} />
              : <Eye size={18} color={COLORS.textMuted} />}
          </Pressable>
        )}
      </Animated.View>

      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm + 2 },

  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 7,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    height: 52,
  },

  inputDisabled: {
    opacity: 0.55,
    backgroundColor: '#F1F5F9',
  },

  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.base,
    height: '100%',
    letterSpacing: 0.1,
  },
  inputWithLeft:  { paddingLeft: 6 },
  inputWithRight: { paddingRight: 6 },
  inputMultiline: {
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
    height: 96,
  },

  leftIcon: {
    paddingLeft: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  rightIcon: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  error: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: 5,
    fontWeight: '500',
  },
});
