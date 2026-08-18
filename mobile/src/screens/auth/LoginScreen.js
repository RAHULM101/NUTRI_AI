// FILE: mobile/src/screens/auth/LoginScreen.js
// Modern Login screen — PKCE Google OAuth, email validation, brute-force lockout, rate limiting

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Animated,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import GoogleIcon from '../../components/common/GoogleIcon';
import AppleIcon from '../../components/common/AppleIcon';
import { loginUser, googleLogin } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { isRateLimited, RATE_LIMITS, getRemainingCooldownSecs } from '../../utils/rateLimiter';

WebBrowser.maybeCompleteAuthSession();

// ── Google OAuth Client IDs ─────────────────────────────────────────────────
// Replace these with YOUR actual Client IDs from Google Cloud Console:
//   https://console.cloud.google.com/apis/credentials
// Create an "OAuth 2.0 Client ID" for:
//   • Android → package: com.nutriai.mobile
//   • iOS     → bundle: com.nutriai.mobile
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// ── Email validation regex ────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Brute force lockout config ────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds

export default function LoginScreen({ navigation }) {
  const { signIn, loadUserProfile } = useAuth();
  const { isDark, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Brute force protection state
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [cooldownSecs, setCooldownSecs] = useState(0);

  // ── Google PKCE Auth Request (Authorization Code Flow) ──────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID.includes('REPLACE') ? undefined : GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['email', 'profile', 'openid'],
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Countdown timer for lockout ───────────────────────────────
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setCooldownSecs(0);
        setFailedAttempts(0);
        setErrorMsg('');
        clearInterval(tick);
      } else {
        setCooldownSecs(remaining);
        setErrorMsg(`Too many failed attempts. Try again in ${remaining}s`);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockedUntil]);

  // ── Shake animation on error ──────────────────────────────────
  const triggerShake = () => {
    triggerHaptic('error');
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Handle the OAuth response from Google ───────────────────────
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication, params } = response;
      const token = authentication?.accessToken || authentication?.idToken || params?.access_token || params?.id_token;
      handleGoogleToken(token);
    } else if (response?.type === 'error') {
      setErrorMsg('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (accessToken) => {
    if (!accessToken) {
      setErrorMsg('Google authentication failed: missing access token.');
      setGoogleLoading(false);
      return;
    }
    try {
      const authRes = await googleLogin(accessToken);
      triggerHaptic('success');
      await loadUserProfile().catch(() => {});
      await signIn(authRes?.user?.is_onboarded || true);
    } catch (err) {
      setErrorMsg(err?.normalizedMessage || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Landing');
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');

    // ── Check brute-force lockout ─────────────────────────────
    if (lockedUntil && Date.now() < lockedUntil) {
      triggerShake();
      return;
    }

    // ── Rate limiting check ───────────────────────────────────
    if (isRateLimited(RATE_LIMITS.LOGIN.key, RATE_LIMITS.LOGIN.maxRequests, RATE_LIMITS.LOGIN.windowMs)) {
      const secs = getRemainingCooldownSecs(RATE_LIMITS.LOGIN.key, RATE_LIMITS.LOGIN.windowMs);
      setErrorMsg(`Too many requests. Please wait ${secs}s before trying again.`);
      triggerShake();
      return;
    }

    // ── Field validation ──────────────────────────────────────
    if (!email.trim() || !password) {
      setErrorMsg('Please fill in all fields');
      triggerShake();
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. you@example.com)');
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const authRes = await loginUser(email.trim(), password);
      triggerHaptic('success');
      const isOnboarded = authRes?.user?.is_onboarded !== undefined ? authRes.user.is_onboarded : true;
      loadUserProfile().catch((e) => console.warn('Profile hydration notice:', e?.message));
      await signIn(isOnboarded);
      setFailedAttempts(0); // Reset on success
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Lock account for LOCKOUT_DURATION_MS
        const until = Date.now() + LOCKOUT_DURATION_MS;
        setLockedUntil(until);
        setCooldownSecs(Math.ceil(LOCKOUT_DURATION_MS / 1000));
        setErrorMsg(`Too many failed attempts. Try again in ${Math.ceil(LOCKOUT_DURATION_MS / 1000)}s`);
      } else {
        const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
        setErrorMsg(
          `${err?.normalizedMessage || 'Invalid credentials.'} ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        );
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (googleLoading || !request) {
      if (!request) {
        console.warn('Google Auth Request is not ready yet.');
      }
      return;
    }

    // ── Rate limiting for Google auth ─────────────────────────
    if (isRateLimited(RATE_LIMITS.GOOGLE_AUTH.key, RATE_LIMITS.GOOGLE_AUTH.maxRequests, RATE_LIMITS.GOOGLE_AUTH.windowMs)) {
      const secs = getRemainingCooldownSecs(RATE_LIMITS.GOOGLE_AUTH.key, RATE_LIMITS.GOOGLE_AUTH.windowMs);
      setErrorMsg(`Please wait ${secs}s before trying Google sign-in again.`);
      return;
    }

    setErrorMsg('');
    setGoogleLoading(true);
    try {
      await promptAsync();
    } catch (err) {
      console.warn('Google Login prompt error:', err);
      setErrorMsg('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = () => {
    Alert.alert(
      'Apple Sign-In',
      'Apple Sign-In requires Apple Developer configuration. Please use Google or Email login.'
    );
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Row with Centered Alignment & Back Button */}
          <View style={styles.headerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: colors.bgCard, borderColor: colors.border },
                pressed && styles.btnPressed,
              ]}
              onPress={handleBack}
              hitSlop={12}
            >
              <ArrowLeft size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../../../assets/nutriai-logo.png')}
              style={[styles.logoImg, isDark && { tintColor: '#ffffff' }]}
              resizeMode="contain"
            />
          </View>

          {/* Animated Form Card */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }, { translateX: shakeAnim }],
              },
            ]}
          >
            <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Log in to continue your nutrition journey
            </Text>

            {/* Email Field */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                <Mail size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLocked}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                <Lock size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLocked}
                />
                <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                  {showPassword ? (
                    <EyeOff size={16} color={colors.textMuted} />
                  ) : (
                    <Eye size={16} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberWrap}
                onPress={() => setRemember((r) => !r)}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    remember && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                  ]}
                >
                  {remember && <Check size={11} color="#fff" strokeWidth={3} />}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>Remember me</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert('Reset Password', 'A password reset link will be sent to your registered email.')
                }
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Error Message */}
            {errorMsg ? (
              <View style={[styles.errorBox, isLocked && styles.errorBoxLocked]}>
                <AlertCircle size={14} color={isLocked ? '#F59E0B' : '#EF4444'} />
                <Text style={[styles.errorText, isLocked && { color: '#D97706' }]}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Failed attempts indicator */}
            {failedAttempts > 0 && !isLocked && (
              <View style={styles.attemptsRow}>
                {[...Array(MAX_FAILED_ATTEMPTS)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.attemptDot,
                      { backgroundColor: i < failedAttempts ? '#EF4444' : (isDark ? '#334155' : '#E2E8F0') },
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Login Button */}
            <Pressable
              style={({ pressed }) => [
                styles.loginBtn,
                pressed && styles.btnPressed,
                isLocked && styles.loginBtnLocked,
              ]}
              onPress={handleLogin}
              disabled={loading || googleLoading || isLocked}
            >
              {isLocked ? (
                <Text style={styles.loginBtnText}>🔒 Locked ({cooldownSecs}s)</Text>
              ) : (
                <Text style={styles.loginBtnText}>Log In →</Text>
              )}
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerWrap}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or continue with</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: colors.border },
                  (pressed || googleLoading) && styles.socialBtnPressed,
                ]}
                onPress={handleGoogleLogin}
                disabled={googleLoading || loading || isLocked}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <GoogleIcon size={18} />
                    <Text style={[styles.socialBtnText, { color: colors.text }]}>Google</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.socialBtn,
                  { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: colors.border },
                  pressed && styles.socialBtnPressed,
                ]}
                onPress={handleAppleLogin}
                disabled={googleLoading || loading}
              >
                <AppleIcon size={18} color={isDark ? '#ffffff' : '#000000'} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Footer Link — Centered */}
          <View style={styles.footerWrap}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Sign Up Free</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="Logging you in..." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING['3xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: SPACING.lg },
  logoImg: { height: 44, width: 170 },

  card: {
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  title: { fontSize: FONT_SIZES['2xl'], fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: FONT_SIZES.sm, marginTop: 2, marginBottom: SPACING.xl },

  fieldWrap: { marginBottom: SPACING.base },
  label: { fontSize: FONT_SIZES.xs, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  input: { flex: 1, fontSize: FONT_SIZES.sm, height: '100%' },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  rememberWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },
  forgotText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.primary },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.lg,
    padding: 10,
    marginBottom: SPACING.md,
  },
  errorBoxLocked: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  errorText: { color: '#EF4444', fontSize: FONT_SIZES.xs, fontWeight: '600', flex: 1 },

  attemptsRow: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  attemptDot: { width: 8, height: 8, borderRadius: 4 },

  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.emerald,
    marginBottom: SPACING.xl,
  },
  loginBtnLocked: {
    backgroundColor: '#94A3B8',
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  loginBtnText: { color: '#ffffff', fontSize: FONT_SIZES.base, fontWeight: '800' },

  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: 8,
  },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },

  socialRow: { flexDirection: 'row', gap: SPACING.md },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    ...SHADOWS.xs,
  },
  socialBtnPressed: { opacity: 0.8 },
  socialBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '700' },

  footerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: { fontSize: FONT_SIZES.sm },
  signupLink: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.primary },
});
