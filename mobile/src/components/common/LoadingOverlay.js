// FILE: mobile/src/components/common/LoadingOverlay.js
// Purpose: Full-screen loading spinner with NutriAI branding
// Replaces: web's LoadingScreen.jsx (CSS animation → ActivityIndicator + Animated)

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';

export default function LoadingOverlay({ visible = false, message = 'Loading...', transparent = false }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={[styles.overlay, transparent && styles.transparentBg]}>
        <View style={styles.card}>
          {/* Emerald spinner */}
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.brand}>NutriAI</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentBg: {
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: SPACING['2xl'],
    alignItems: 'center',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 16,
  },
  spinnerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16,185,129,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  brand: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
});
