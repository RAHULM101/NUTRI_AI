// FILE: mobile/src/components/common/SubscriptionModal.js
// Purpose: Dedicated Subscription & Pricing Modal — Clean Vibrant Active Card Styling & Exact Plans

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { X, Check, Star, Crown, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { updateProfilePlan } from '../../services/profileService';
import { triggerHaptic } from '../../utils/haptics';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

export const PLANS = [
  {
    id: 'Free',
    tag: 'Free',
    title: 'Free Plan',
    price: '0',
    subtitle: 'Always free, no card needed',
    free: true,
    recommended: false,
    scanLimit: 3,
    features: [
      '3 Meal Scans / day',
      'Basic Access',
    ],
  },
  {
    id: 'Pro',
    tag: 'Pro',
    title: 'Pro Plan',
    price: '149',
    subtitle: 'Best for serious health goals',
    free: false,
    recommended: true,
    scanLimit: 10,
    features: [
      '10 Meal Scans / day',
      'Limited Nia AI Access',
      '7 Days Meal History',
      'PDF Report Export',
    ],
  },
  {
    id: 'Premium',
    tag: 'Premium',
    title: 'Premium Plan',
    price: '499',
    subtitle: 'Everything, no limits',
    free: false,
    recommended: false,
    scanLimit: 20,
    features: [
      '20 Meal Scans / day',
      'Unlimited Nia AI',
      '30 Days Meal History',
      'weekly and monthly PDF Report Export',
      'Smart Reminders',
    ],
  },
];

export default function SubscriptionModal({ visible, onClose }) {
  const { isDark, colors } = useTheme();
  const { userData, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const currentPlanId = userData?.selectedPlan || 'Pro';

  const handleSelectPlan = (plan) => {
    triggerHaptic('selection');
    if (plan.id === currentPlanId) {
      Alert.alert('Active Plan', `You are currently on the ${plan.tag} plan.`);
      return;
    }

    Alert.alert(
      `Switch to ${plan.tag} Plan`,
      `Confirm switching to the ${plan.tag} plan (${plan.free ? 'Free' : `₹${plan.price}/mo`})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Plan',
          style: 'default',
          onPress: () => {
            triggerHaptic('success');
            // 1. Instant optimistic UI update (0ms latency)
            if (updateUserData) {
              updateUserData({ selectedPlan: plan.id });
            }
            onClose();
            Alert.alert('Plan Updated', `Your account is now on ${plan.tag} Plan!`);

            // 2. Non-blocking background sync to backend
            updateProfilePlan(plan.id).catch((err) => {
              console.warn('Background plan sync notice:', err?.message);
            });
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.frostedBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Crown size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan 👑</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Unlock your full nutrition & AI potential</Text>
              </View>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {PLANS.map((plan) => {
              const isSelected = (userData?.selectedPlan || 'Pro').toLowerCase() === plan.id.toLowerCase();
              return (
                <Pressable
                  key={plan.id}
                  style={({ pressed }) => [
                    styles.planCard,
                    {
                      backgroundColor: colors.bgCard,
                      borderColor: isSelected
                        ? COLORS.primary
                        : plan.recommended
                        ? (isDark ? 'rgba(20,184,166,0.4)' : 'rgba(20,184,166,0.5)')
                        : colors.border,
                      borderWidth: 1.5,
                    },
                    isSelected && {
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.65)' : COLORS.primary,
                      borderWidth: 1.5,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.04)',
                    },
                    pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                >
                  {plan.recommended && (
                    <View style={styles.recommendedBadge}>
                      <Star size={10} color="#fff" fill="#fff" />
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}

                  <View style={styles.planHeader}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.planTag, { color: isSelected ? COLORS.primary : plan.recommended ? COLORS.teal : colors.textSecondary }]}>
                          {plan.tag}
                        </Text>
                        {isSelected && (
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={12} color="#ffffff" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.planSubtitle, { color: colors.textMuted }]}>{plan.subtitle}</Text>
                    </View>
                    <View style={styles.planPriceWrap}>
                      {plan.free ? (
                        <Text style={[styles.planPrice, { color: isSelected ? COLORS.primary : colors.text }]}>Free</Text>
                      ) : (
                        <Text style={[styles.planPrice, { color: isSelected ? COLORS.primary : colors.text }]}>
                          ₹{plan.price}<Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>/mo</Text>
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.planFeatures}>
                    {plan.features.map((f) => (
                      <View key={f} style={styles.featureRow}>
                        <Check size={12} color={isSelected ? COLORS.primary : COLORS.teal} strokeWidth={3} />
                        <Text style={[styles.featureText, { color: isSelected ? colors.text : colors.textSecondary }]}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.guaranteeRow}>
              <ShieldCheck size={14} color={colors.textMuted} />
              <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
                Flexible plans • Tap any card to switch instantly
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  frostedBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    maxHeight: '92%',
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.emerald,
  },
  title: { fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, marginTop: 1 },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
  },

  scrollContent: { paddingBottom: SPACING.xl },

  planCard: {
    borderRadius: RADIUS['2xl'],
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    position: 'relative',
    elevation: 0,
    shadowColor: 'transparent',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  recommendedText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  planTag: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  planSubtitle: { fontSize: 12, marginTop: 2 },
  planPriceWrap: { alignItems: 'flex-end' },
  planPrice: { fontSize: 26, fontWeight: '900' },
  planFeatures: { gap: 8, paddingTop: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13, fontWeight: '600' },

  ctaBtn: {
    borderRadius: RADIUS.xl,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ctaTextWhite: { fontSize: 14, fontWeight: '800', color: '#ffffff' },

  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  guaranteeText: { fontSize: 11, fontWeight: '600' },
});
