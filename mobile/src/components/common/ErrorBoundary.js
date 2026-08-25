// FILE: mobile/src/components/common/ErrorBoundary.js
// Purpose: Global React Error Boundary — catches unhandled component crashes gracefully
// Provides a luxury recovery interface instead of white-screen crash

import React from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (__DEV__) {
      console.error('💥 Uncaught UI Error in ErrorBoundary:', error, errorInfo);
    }
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#030712" />
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={32} color="#EF4444" />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              NutriAI encountered an unexpected issue, but your health data and sessions are secure.
            </Text>

            {__DEV__ && this.state.error ? (
              <View style={styles.devErrorBox}>
                <Text style={styles.devErrorText} numberOfLines={3}>
                  {String(this.state.error?.message || this.state.error)}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && styles.btnPressed]}
              onPress={this.handleRestart}
            >
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.retryBtnText}>Reload App Interface</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  devErrorBox: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  devErrorText: {
    color: '#F87171',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: RADIUS.xl,
    width: '100%',
    ...SHADOWS.emerald,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
  },
});
