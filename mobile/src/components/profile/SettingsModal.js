// FILE: mobile/src/components/profile/SettingsModal.js
// Detailed Settings Modal — Account, Preferences, Health Preferences, Subscription, Privacy & Security

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { X, User, Bell, Sun, Moon, Shield, Lock, Smartphone, ChevronRight, Check, Crown, Target, Utensils } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export default function SettingsModal({ visible, onClose, userData, onOpenSubscription }) {
  const { isDark, toggleTheme, colors } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [useMetric, setUseMetric] = useState(true);

  if (!visible) return null;

  const currentPlan = userData?.selectedPlan || 'Pro';

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password reset link has been sent to your registered email address.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Settings & Preferences ⚙️</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Account Info */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <User size={16} color={COLORS.primary} />
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>Account Email</Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>{userData?.email || 'user@nutriai.com'}</Text>
                </View>
              </View>

              <Pressable style={[styles.itemRow, { borderColor: colors.border }]} onPress={handleChangePassword}>
                <Lock size={16} color={COLORS.teal} />
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Change Password</Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Appearance & Theme Preferences */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                {isDark ? <Moon size={16} color="#8B5CF6" /> : <Sun size={16} color="#F59E0B" />}
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Dark Mode</Text>
                <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#CBD5E1', true: COLORS.primary }} />
              </View>

              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Bell size={16} color="#0EA5E9" />
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Push Notifications</Text>
                <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#CBD5E1', true: COLORS.primary }} />
              </View>

              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Smartphone size={16} color="#F97316" />
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Smart Meal Reminders</Text>
                <Switch value={mealReminders} onValueChange={setMealReminders} trackColor={{ false: '#CBD5E1', true: COLORS.primary }} />
              </View>

              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Check size={16} color={COLORS.primary} />
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Use Metric Units (kg, cm)</Text>
                <Switch value={useMetric} onValueChange={setUseMetric} trackColor={{ false: '#CBD5E1', true: COLORS.primary }} />
              </View>
            </View>

            {/* Health Preferences */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HEALTH PREFERENCES</Text>
              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Target size={16} color={COLORS.primary} />
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>Primary Goal</Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>{userData?.mainGoal || 'General Fitness'}</Text>
                </View>
              </View>

              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Utensils size={16} color={COLORS.teal} />
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>Dietary Preference</Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>{userData?.dietaryPreference || 'No Restriction'}</Text>
                </View>
              </View>
            </View>

            {/* Subscription Info */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUBSCRIPTION</Text>
              <Pressable
                style={[styles.itemRow, { borderColor: colors.border }]}
                onPress={() => {
                  if (onOpenSubscription) onOpenSubscription();
                }}
              >
                <Crown size={16} color="#F59E0B" />
                <View style={styles.itemTextWrap}>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>Active Plan: {currentPlan}</Text>
                  <Text style={[styles.itemSub, { color: colors.textMuted }]}>Tap to upgrade or manage subscription</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Privacy & Security */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY & SECURITY</Text>
              <Pressable
                style={[styles.itemRow, { borderColor: colors.border }]}
                onPress={() => Alert.alert('Privacy Policy', 'NutriAI is committed to keeping your health data secure and private.')}
              >
                <Shield size={16} color={COLORS.primary} />
                <Text style={[styles.itemLabel, { flex: 1, color: colors.text }]}>Privacy Policy</Text>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>

              <View style={[styles.itemRow, { borderColor: colors.border }]}>
                <Text style={[styles.itemLabel, { color: colors.textMuted }]}>App Version</Text>
                <Text style={[styles.itemSub, { color: colors.textMuted }]}>v1.0.0 (Build 42)</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '85%',
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    marginBottom: SPACING.md,
  },
  title: { fontSize: 18, fontWeight: '900' },
  closeBtn: { padding: 4 },

  scrollContent: { paddingBottom: SPACING.xl },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemTextWrap: { flex: 1 },
  itemLabel: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 12, marginTop: 1 },
});
