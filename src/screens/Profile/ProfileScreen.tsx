import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, HUNTER_LEVELS } from '../../theme';
import { useUserStore } from '../../stores/userStore';
import { BADGES } from '../../data/badges';

export default function ProfileScreen({ navigation }: any) {
  const { profile } = useUserStore();
  if (!profile) return null;

  const currentLevel = HUNTER_LEVELS.find((l) => l.level === profile.level) || HUNTER_LEVELS[0];
  const nextLevel = HUNTER_LEVELS.find((l) => l.level === profile.level + 1);
  const xpProgress = nextLevel
    ? (profile.xp - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)
    : 1;

  const earnedBadges = BADGES.filter((b) => profile.badges.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !profile.badges.includes(b.id));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={s.header}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarEmoji}>🏷️</Text>
          </View>
          <Text style={s.displayName}>{profile.displayName}</Text>
          <View style={s.tierBadge}>
            <Text style={s.tierText}>
              {profile.tier === 'free' ? '🆓 Free' : profile.tier === 'buyer_pro' ? '💎 Buyer Pro' : '⚡ Seller Pro'}
            </Text>
          </View>
        </View>

        {/* Level + XP */}
        <View style={s.levelCard}>
          <View style={s.levelHeader}>
            <Text style={s.levelTitle}>Level {profile.level}</Text>
            <Text style={s.levelName}>{profile.title}</Text>
          </View>
          <View style={s.xpBarBg}>
            <View style={[s.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
          </View>
          <View style={s.xpRow}>
            <Text style={s.xpText}>{profile.xp} XP</Text>
            {nextLevel && (
              <Text style={s.xpNext}>{nextLevel.xpRequired} XP for Lv.{nextLevel.level}</Text>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <StatBox icon="🔥" value={profile.huntStreak} label="Hunt Streak" color={COLORS.error} />
          <StatBox icon="🏆" value={profile.longestHuntStreak} label="Best Streak" color={COLORS.accent} />
          <StatBox icon="📍" value={profile.totalVisits} label="Visits" color={COLORS.primary} />
          <StatBox icon="💰" value={profile.coins} label="Coins" color={COLORS.accent} />
          <StatBox icon="❤️" value={profile.totalSaves} label="Saved" color={COLORS.error} />
          <StatBox icon="📦" value={profile.totalSalesPosted} label="Posted" color={COLORS.pro} />
        </View>

        {/* Badges */}
        <Text style={s.sectionTitle}>🏅 Badges ({earnedBadges.length}/{BADGES.length})</Text>

        {earnedBadges.length > 0 && (
          <View style={s.badgeGrid}>
            {earnedBadges.map((badge) => (
              <View key={badge.id} style={s.badgeCard}>
                <Text style={s.badgeEmoji}>{badge.emoji}</Text>
                <Text style={s.badgeName}>{badge.name}</Text>
                <Text style={s.badgeDesc} numberOfLines={2}>{badge.description}</Text>
              </View>
            ))}
          </View>
        )}

        {lockedBadges.length > 0 && (
          <>
            <Text style={s.subSection}>Locked</Text>
            <View style={s.badgeGrid}>
              {lockedBadges.slice(0, 8).map((badge) => (
                <View key={badge.id} style={[s.badgeCard, s.badgeLocked]}>
                  <Text style={[s.badgeEmoji, { opacity: 0.3 }]}>🔒</Text>
                  <Text style={[s.badgeName, { color: COLORS.textMuted }]}>{badge.name}</Text>
                  <Text style={s.badgeRequirement}>{badge.requirement}</Text>
                </View>
              ))}
            </View>
            {lockedBadges.length > 8 && (
              <Text style={s.moreBadges}>+{lockedBadges.length - 8} more badges to unlock</Text>
            )}
          </>
        )}

        {/* Pro Upsell */}
        {profile.tier === 'free' && (
          <View style={s.proCard}>
            <Text style={s.proTitle}>🚀 Upgrade to Pro</Text>
            <Text style={s.proDesc}>
              Unlimited saves, advanced alerts, early access to new sales, and badge boosts.
            </Text>
            <View style={s.proBtns}>
              <TouchableOpacity style={s.proBtnBuyer}>
                <Text style={s.proBtnText}>Buyer Pro — $4.99/mo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.proBtnSeller}>
                <Text style={s.proBtnText}>Seller Pro — $9.99/mo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Link */}
        <TouchableOpacity style={s.settingsBtn}>
          <Text style={s.settingsText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.xl, paddingBottom: 100 },
  // Header
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryBg,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary,
  },
  avatarEmoji: { fontSize: 36 },
  displayName: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginTop: SPACING.md },
  tierBadge: {
    backgroundColor: COLORS.bgMuted, paddingHorizontal: SPACING.md, paddingVertical: 4,
    borderRadius: RADIUS.full, marginTop: SPACING.sm,
  },
  tierText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  // Level
  levelCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  levelTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
  levelName: { color: COLORS.textSecondary, fontSize: 14, fontStyle: 'italic' },
  xpBarBg: { height: 10, borderRadius: 5, backgroundColor: COLORS.bgMuted, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 5, backgroundColor: COLORS.primary },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  xpText: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  xpNext: { color: COLORS.textMuted, fontSize: 12 },
  // Stats
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.xl,
  },
  statBox: {
    width: '30%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, margin: '1.5%',
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  // Badges
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.md },
  subSection: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  badgeCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, margin: '1.5%',
  },
  badgeLocked: { opacity: 0.5 },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeName: { color: COLORS.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  badgeDesc: { color: COLORS.textSecondary, fontSize: 10, textAlign: 'center', marginTop: 2 },
  badgeRequirement: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginTop: 2, fontStyle: 'italic' },
  moreBadges: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.md },
  // Pro
  proCard: {
    backgroundColor: COLORS.proBg, borderRadius: RADIUS.lg, padding: SPACING.xl,
    marginTop: SPACING.xxl, borderWidth: 1, borderColor: COLORS.pro + '30',
  },
  proTitle: { color: COLORS.pro, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm },
  proDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: SPACING.lg },
  proBtns: {},
  proBtnBuyer: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  proBtnSeller: {
    backgroundColor: COLORS.pro, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  proBtnText: { color: COLORS.textInverse, fontSize: 14, fontWeight: '700' },
  // Settings
  settingsBtn: {
    marginTop: SPACING.xxl, paddingVertical: SPACING.lg, alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
  },
  settingsText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
});
