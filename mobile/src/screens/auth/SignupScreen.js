// FILE: mobile/src/screens/auth/SignupScreen.js
// Modern Signup screen — PKCE Google OAuth, email validation, rate limiting

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
import { Mail, Lock, ArrowLeft, Check, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import GoogleIcon from '../../components/common/GoogleIcon';
import AppleIcon from '../../components/common/AppleIcon';
import { registerUser, googleLogin } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { isRateLimited, RATE_LIMITS, getRemainingCooldownSecs } from '../../utils/rateLimiter';

WebBrowser.maybeCompleteAuthSession();

// ── Google OAuth Client IDs ─────────────────────────────────────────────────
// Replace these with YOUR actual Client IDs from Google Cloud Console:
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// ── Email validation regex ────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PasswordStrength({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#eab308', COLORS.primary];

  return (
    <View style={ps.wrapper}>
      <View style={ps.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[ps.bar, { backgroundColor: i <= score ? colors[score] : '#E2E8F0' }]}
          />
        ))}
      </View>
      {score > 0 && <Text style={[ps.label, { color: colors[score] }]}>{labels[score]}</Text>}
    </View>
  );
}

const ps = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 4 },
  bars: { flexDirection: 'row', gap: 4, flex: 1 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', minWidth: 42 },
});

export default function SignupScreen({ navigation }) {
  const { signIn, loadUserProfile } = useAuth();
  const { isDark, colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Google OAuth Request (Native Android & Web Flow) ──────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token token',
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
      setErrorMsg('Google sign-in failed: no token received.');
      setGoogleLoading(false);
      return;
    }
    try {
      const authRes = await googleLogin(accessToken);
      triggerHaptic('success');
      await loadUserProfile().catch(() => {});
      await signIn(authRes?.user?.is_onboarded || false);
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

  const handleSignup = async () => {
    setErrorMsg('');

    // ── Rate limiting check ───────────────────────────────────
    if (isRateLimited(RATE_LIMITS.SIGNUP.key, RATE_LIMITS.SIGNUP.maxRequests, RATE_LIMITS.SIGNUP.windowMs)) {
      const secs = getRemainingCooldownSecs(RATE_LIMITS.SIGNUP.key, RATE_LIMITS.SIGNUP.windowMs);
      setErrorMsg(`Too many attempts. Please wait ${secs}s before trying again.`);
      triggerShake();
      return;
    }

    // ── Field validation ──────────────────────────────────────
    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields');
      triggerShake();
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('Please enter a valid email address (e.g. you@example.com)');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      triggerShake();
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      triggerShake();
      return;
    }
    if (!agreed) {
      setErrorMsg('Please agree to the Terms of Service to continue');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await registerUser(email.trim(), password, confirmPassword);
      triggerHaptic('success');
      await signIn(false);
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setErrorMsg(msg || 'Registration failed.');
      } else {
        setErrorMsg(err?.normalizedMessage || 'Registration failed. Please try again.');
      }
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      console.warn('Google Signup prompt error:', err);
      setErrorMsg('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleAppleSignup = () => {
    Alert.alert(
      'Apple Sign-In',
      'Apple Sign-In requires Apple Developer configuration. Please use Google or Email registration.'
    );
  };

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
          {/* Header Row */}
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
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Join NutriAI and start your personalized nutrition journey
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
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPw}
                />
                <Pressable onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                  {showPw ? <EyeOff size={16} color={colors.textMuted} /> : <Eye size={16} color={colors.textMuted} />}
                </Pressable>
              </View>
              <PasswordStrength password={password} />
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldWrap}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
                <Lock size={16} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setErrorMsg(''); }}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPw}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
              </View>
            </View>

            {/* Terms checkbox */}
            <Pressable style={styles.termsWrap} onPress={() => setAgreed((a) => !a)}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  agreed && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                ]}
              >
                {agreed && <Check size={11} color="#fff" strokeWidth={3} />}
              </View>
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                I agree to NutriAI <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </Pressable>

            {/* Error Message */}
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Signup Button */}
            <Pressable
              style={({ pressed }) => [styles.signupBtn, pressed && styles.btnPressed]}
              onPress={handleSignup}
              disabled={loading || googleLoading}
            >
              <Text style={styles.signupBtnText}>Create Account →</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerWrap}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>or sign up with</Text>
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
                onPress={handleGoogleSignup}
                disabled={googleLoading || loading}
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
                onPress={handleAppleSignup}
                disabled={googleLoading || loading}
              >
                <AppleIcon size={18} color={isDark ? '#ffffff' : '#000000'} />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>Apple</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Footer Link */}
          <View style={styles.footerWrap}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Log In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} message="Creating your account..." />
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

  termsWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: SPACING.lg },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: { fontSize: 12, lineHeight: 18, flex: 1 },
  linkText: { color: COLORS.primary, fontWeight: '700' },

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
  errorText: { color: '#EF4444', fontSize: FONT_SIZES.xs, fontWeight: '600', flex: 1 },

  signupBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.emerald,
    marginBottom: SPACING.xl,
  },
  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  signupBtnText: { color: '#ffffff', fontSize: FONT_SIZES.base, fontWeight: '800' },

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
  loginLink: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.primary },
});
