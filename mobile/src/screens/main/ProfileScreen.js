// FILE: mobile/src/screens/main/ProfileScreen.js
// Modern profile — Direct SubscriptionModal trigger for Upgrade Plan, functional Settings Modal, Theme support

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, LogOut, Edit2, Target, Activity, Droplets,
  Flame, Settings, ChevronRight, Shield, Star, Crown, Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import SettingsModal from '../../components/profile/SettingsModal';
import SubscriptionModal from '../../components/common/SubscriptionModal';
import { logoutUser } from '../../services/authService';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

function ProfileStat({ label, value, color, colors }) {
  return (
    <View style={[statStyles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <Text style={[statStyles.value, { color: color || colors.text }]}>{value || '—'}</Text>
      <Text style={[statStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  value: { fontSize: FONT_SIZES.lg, fontWeight: '900', marginBottom: 2, letterSpacing: -0.3 },
  label: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
});

function InfoRow({ icon: Icon, label, value, colors }) {
  if (!value) return null;
  return (
    <View style={[rowStyles.row, { borderColor: colors.border }]}>
      <View style={rowStyles.iconWrap}>
        <Icon size={14} color={colors.textMuted} />
      </View>
      <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  iconWrap: { width: 28, alignItems: 'center' },
  label: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '600' },
  value: { fontSize: FONT_SIZES.sm, fontWeight: '700', maxWidth: '50%', textAlign: 'right' },
});

function MenuItem({ icon: Icon, label, iconColor, onPress, colors }) {
  return (
    <Pressable style={({ pressed }) => [rowStyles.row, { borderColor: colors.border }, pressed && { opacity: 0.75 }]} onPress={onPress}>
      <View style={[menuStyles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
        <Icon size={14} color={iconColor} />
      </View>
      <Text style={[menuStyles.label, { color: colors.text }]}>{label}</Text>
      <ChevronRight size={15} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

const menuStyles = StyleSheet.create({
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: FONT_SIZES.sm, fontWeight: '700' },
});

export default function ProfileScreen({ navigation }) {
  const { userData, userMetrics, signOut } = useAuth();
  const { isDark, colors } = useTheme();

  const [showSettings, setShowSettings] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);

  const profilePct = getProfileCompletion(userData);
  const name = userData?.name || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'NutriAI User';
  const photo = userData?.photo;
  const currentPlan = userData?.selectedPlan || 'Pro';

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logoutUser();
          signOut();
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('Onboarding', { initialData: userData, isEditMode: true });
  };

  const [photoError, setPhotoError] = useState(false);
  const hasValidPhoto = Boolean(photo && typeof photo === 'string' && photo.trim().length > 5 && !photo.includes('null'));

  const initials = name && name !== 'Member'
    ? name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'N';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar + name card */}
        <View style={[styles.avatarCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.avatarWrap}>
            {hasValidPhoto && !photoError ? (
              <Image source={{ uri: photo }} onError={() => setPhotoError(true)} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? 'rgba(16,185,129,0.16)' : '#E6F4EA', borderColor: COLORS.primary }]}>
                {initials ? (
                  <Text style={[styles.avatarInitials, { color: COLORS.primary }]}>{initials}</Text>
                ) : (
                  <User size={36} color={COLORS.primary} />
                )}
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.goalLabel, { color: colors.textMuted }]}>{userData?.mainGoal || 'Nutrition Member'}</Text>

          {/* Subscription Plan Badge & Upgrade Trigger */}
          <View style={styles.planBadgeRow}>
            <View style={styles.planBadge}>
              <Crown size={12} color="#ffffff" />
              <Text style={styles.planBadgeText}>{currentPlan} Plan Member</Text>
            </View>

            {/* Direct Upgrade Plan Button */}
            <Pressable
              style={({ pressed }) => [styles.upgradePlanBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setShowSubscription(true)}
            >
              <Sparkles size={12} color="#ffffff" />
              <Text style={styles.upgradePlanBtnText}>Upgrade Plan</Text>
            </Pressable>
          </View>

          {/* Completion bar */}
          {profilePct < 100 && (
            <View style={styles.completionSection}>
              <View style={[styles.completionTrack, { backgroundColor: isDark ? '#334155' : '#E8F5F1' }]}>
                <View style={[styles.completionFill, { width: `${profilePct}%` }]} />
              </View>
              <Text style={[styles.completionText, { color: colors.textMuted }]}>Profile {profilePct}% complete</Text>
            </View>
          )}

          {/* Edit button */}
          <Pressable style={styles.editBtn} onPress={handleEditProfile}>
            <Edit2 size={13} color={COLORS.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <ProfileStat
            label="Weight"
            value={userData?.weight ? `${userData.weight} kg` : null}
            color={colors.text}
            colors={colors}
          />
          <ProfileStat
            label="Target"
            value={userData?.targetWeight ? `${userData.targetWeight} kg` : null}
            color={COLORS.primary}
            colors={colors}
          />
          <ProfileStat
            label="Calories"
            value={userData?.calorieTarget ? `${userData.calorieTarget}` : null}
            color={COLORS.teal}
            colors={colors}
          />
          <ProfileStat
            label="Water"
            value={userData?.waterGoal ? `${userData.waterGoal}L` : null}
            color={COLORS.water}
            colors={colors}
          />
        </View>

        {/* Profile Details */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile Details</Text>
          <InfoRow icon={User} label="Gender" value={userData?.gender} colors={colors} />
          <InfoRow icon={Activity} label="Activity Level" value={userData?.activityLevel} colors={colors} />
          <InfoRow icon={Target} label="Primary Goal" value={userData?.mainGoal} colors={colors} />
          <InfoRow icon={Droplets} label="Water Goal" value={userData?.waterGoal ? `${userData.waterGoal}L/day` : null} colors={colors} />
          <InfoRow icon={Flame} label="Calorie Target" value={userData?.calorieTarget ? `${userData.calorieTarget} kcal` : null} colors={colors} />
          {userData?.dietaryPreference ? (
            <InfoRow icon={Settings} label="Diet" value={userData.dietaryPreference} colors={colors} />
          ) : null}
          {userData?.allergies?.length > 0 ? (
            <InfoRow icon={Shield} label="Allergies" value={Array.isArray(userData.allergies) ? userData.allergies.join(', ') : userData.allergies} colors={colors} />
          ) : null}
        </View>

        {/* Account & Settings section */}
        <View style={[styles.section, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account & Settings</Text>
          <MenuItem
            icon={Settings}
            label="Settings & Preferences"
            iconColor="#6366F1"
            onPress={() => setShowSettings(true)}
            colors={colors}
          />
          <MenuItem
            icon={Crown}
            label="Subscription & Plan Upgrade"
            iconColor="#F59E0B"
            onPress={() => setShowSubscription(true)}
            colors={colors}
          />
          <MenuItem
            icon={Shield}
            label="Privacy & Security"
            iconColor="#0EA5E9"
            onPress={() => Alert.alert('Privacy & Security', 'Your data is secured with end-to-end encryption.')}
            colors={colors}
          />
        </View>

        {/* Logout */}
        <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]} onPress={handleLogout}>
          <LogOut size={17} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={[styles.version, { color: colors.textMuted }]}>NutriAI Mobile v1.0.0</Text>
      </ScrollView>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        userData={userData}
        onOpenSubscription={() => { setShowSettings(false); setShowSubscription(true); }}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscription}
        onClose={() => setShowSubscription(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: SPACING.base, paddingBottom: SPACING['3xl'] },

  avatarCard: {
    alignItems: 'center',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  avatarWrap: { marginBottom: SPACING.sm },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  name: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 2 },
  goalLabel: { fontSize: FONT_SIZES.sm, marginBottom: SPACING.sm },

  planBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  planBadgeText: { fontSize: 11, fontWeight: '900', color: '#ffffff' },

  upgradePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    ...SHADOWS.emerald,
  },
  upgradePlanBtnText: { fontSize: 11, fontWeight: '900', color: '#ffffff' },

  completionSection: { width: '80%', marginBottom: SPACING.md, alignItems: 'center' },
  completionTrack: {
    width: '100%',
    height: 5,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  completionFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  completionText: { fontSize: FONT_SIZES.xs, fontWeight: '600' },

  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  editBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '800', color: COLORS.primary },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.base },

  section: {
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: FONT_SIZES.base, fontWeight: '800', marginBottom: SPACING.sm },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    marginBottom: SPACING.lg,
  },
  logoutText: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.error },

  version: { textAlign: 'center', fontSize: FONT_SIZES.xs },
});
