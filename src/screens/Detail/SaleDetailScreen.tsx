import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Linking, Share, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { useUserStore } from '../../stores/userStore';
import { useSaleStore } from '../../stores/saleStore';
import { useXPToast } from '../../components/XPToast';
import { analytics } from '../../services/analytics';
import type { Sale } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SaleDetailScreen({ route, navigation }: any) {
  const sale: Sale = route.params.sale;
  const { isSaved, toggleSaveSale, isVisited, markVisited, profile, incrementConfirmations } = useUserStore();
  const { confirmSale, getConfirmation, isLikelyEnded } = useSaleStore();
  const { showXP, showCoins, showToast, showBadge } = useXPToast();
  const [photoIndex, setPhotoIndex] = useState(0);

  const saved = isSaved(sale.id);
  const visited = isVisited(sale.id);
  const confirmation = getConfirmation(sale.id);
  const likelyEnded = isLikelyEnded(sale.id);

  // Track view
  React.useEffect(() => {
    analytics.saleView(sale.id);
  }, [sale.id]);

  const startDate = new Date(sale.startDate + 'T00:00:00');
  const endDate = new Date(sale.endDate + 'T00:00:00');
  const dateStr = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const endStr = sale.startDate !== sale.endDate
    ? ` — ${endDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
    : '';

  const openDirections = () => {
    analytics.directions(sale.id);
    const url = `https://maps.google.com/?q=${sale.location.latitude},${sale.location.longitude}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    analytics.share(sale.id);
    try {
      await Share.share({
        message: `Check out this yard sale: "${sale.title}" at ${sale.address}, ${sale.city} — ${dateStr} ${sale.startTime}–${sale.endTime}\n\nFound on YardFind 🗺️`,
      });
    } catch { }
  };

  const handleMarkVisited = () => {
    if (!isVisited(sale.id)) {
      markVisited(sale.id, sale.location.latitude, sale.location.longitude);
      analytics.saleVisit(sale.id);
      showXP(10);
      setTimeout(() => showCoins(5), 400);
    }
  };

  const handleToggleSave = () => {
    const nowSaved = toggleSaveSale(sale.id);
    analytics.saleSave(sale.id, nowSaved);
    if (nowSaved) showXP(2);
  };

  const handleConfirm = (vote: 'yes' | 'no') => {
    confirmSale(sale.id, vote);
    if (vote === 'yes') {
      analytics.confirmYes(sale.id);
      incrementConfirmations();
      showToast('Thanks! Confirmed as active', '✅', COLORS.success);
      showXP(3);
    } else {
      analytics.confirmNo(sale.id);
      showToast('Reported as ended', '📋', COLORS.textSecondary);
    }
  };

  // Format "Last confirmed" relative time
  const getLastConfirmedLabel = (): string | null => {
    if (!confirmation.lastConfirmedAt) return null;
    const diff = Date.now() - new Date(confirmation.lastConfirmedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const lastConfirmed = getLastConfirmedLabel();

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Photo carousel */}
        {sale.photos.length > 0 && (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            >
              {sale.photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={s.photo} />
              ))}
            </ScrollView>
            {sale.photos.length > 1 && (
              <View style={s.photoDots}>
                {sale.photos.map((_, i) => (
                  <View key={i} style={[s.dot, photoIndex === i && s.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Back button overlay */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={s.body}>
          {/* Likely Ended Banner */}
          {likelyEnded && (
            <View style={s.endedBanner}>
              <Text style={s.endedText}>⚠️ Likely Ended — Multiple users reported this sale has ended</Text>
            </View>
          )}

          {sale.isFeatured && !likelyEnded && (
            <View style={s.featuredBadge}>
              <Text style={s.featuredText}>⭐ FEATURED SALE</Text>
            </View>
          )}

          <Text style={s.title}>{sale.title}</Text>

          {/* Last Confirmed Badge */}
          {lastConfirmed && (
            <View style={s.confirmedRow}>
              <Text style={s.confirmedText}>✅ Last confirmed: {lastConfirmed}</Text>
              <Text style={s.confirmedCount}>
                {confirmation.yesCount} 👍 · {confirmation.noCount} 👎
              </Text>
            </View>
          )}

          {/* Date & Time */}
          <View style={s.infoRow}>
            <Text style={s.infoIcon}>📅</Text>
            <View>
              <Text style={s.infoLabel}>{dateStr}{endStr}</Text>
              <Text style={s.infoSub}>{sale.startTime} — {sale.endTime}</Text>
            </View>
          </View>

          {/* Address */}
          <TouchableOpacity style={s.infoRow} onPress={openDirections}>
            <Text style={s.infoIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>{sale.address}</Text>
              <Text style={s.infoSub}>{sale.city}, {sale.state} {sale.zipCode}</Text>
            </View>
            <Text style={s.directionsBtn}>🧭 Directions</Text>
          </TouchableOpacity>

          {/* Description */}
          <Text style={s.sectionTitle}>About This Sale</Text>
          <Text style={s.description}>{sale.description}</Text>

          {/* Categories */}
          <Text style={s.sectionTitle}>Categories</Text>
          <View style={s.tagRow}>
            {sale.categories.map((catId) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              return cat ? (
                <View key={catId} style={s.categoryChip}>
                  <Text style={s.categoryText}>{cat.emoji} {cat.label}</Text>
                </View>
              ) : null;
            })}
          </View>

          {/* Tags / Items */}
          {sale.tags.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Items You Might Find</Text>
              <View style={s.tagRow}>
                {sale.tags.map((tag) => (
                  <View key={tag} style={s.itemTag}>
                    <Text style={s.itemTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Stats */}
          <View style={s.statsCard}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{sale.viewCount}</Text>
              <Text style={s.statLabel}>views</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{sale.saveCount}</Text>
              <Text style={s.statLabel}>saved</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{sale.visitCount}</Text>
              <Text style={s.statLabel}>visited</Text>
            </View>
            {sale.ratingCount > 0 && (
              <View style={s.statBox}>
                <Text style={s.statValue}>⭐ {sale.rating.toFixed(1)}</Text>
                <Text style={s.statLabel}>{sale.ratingCount} ratings</Text>
              </View>
            )}
          </View>

          {/* ── Trust Loop: Confirmation Buttons ── */}
          <Text style={s.sectionTitle}>Is this sale still happening?</Text>
          <View style={s.trustRow}>
            <TouchableOpacity
              style={[s.trustBtn, s.trustYes, confirmation.userVote === 'yes' && s.trustYesActive]}
              onPress={() => handleConfirm('yes')}
            >
              <Text style={[s.trustBtnText, confirmation.userVote === 'yes' && s.trustBtnTextActive]}>
                ✅ Still happening
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.trustBtn, s.trustNo, confirmation.userVote === 'no' && s.trustNoActive]}
              onPress={() => handleConfirm('no')}
            >
              <Text style={[s.trustBtnText, confirmation.userVote === 'no' && s.trustBtnTextActive]}>
                ❌ Ended / Not here
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={s.trustHint}>
            Help fellow hunters by confirming sale status (+3 XP)
          </Text>

          {/* Action Buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={[s.actionBtn, saved && s.actionBtnActive]}
              onPress={handleToggleSave}
            >
              <Text style={s.actionBtnText}>{saved ? '❤️ Saved' : '🤍 Save'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionBtn, visited && s.actionBtnVisited]}
              onPress={handleMarkVisited}
              disabled={visited}
            >
              <Text style={s.actionBtnText}>{visited ? '✅ Visited' : '📍 Mark Visited'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
              <Text style={s.actionBtnText}>📤 Share</Text>
            </TouchableOpacity>
          </View>

          {/* XP hint */}
          {!visited && (
            <Text style={s.xpHint}>📊 Mark as visited to earn +10 XP and +5 coins!</Text>
          )}

          {/* Pro upsell if free user */}
          {profile?.tier === 'free' && (
            <View style={s.proCard}>
              <Text style={s.proTitle}>🔔 Never miss a sale like this</Text>
              <Text style={s.proDesc}>
                Buyer Pro gives you unlimited alerts when new sales match your interests.
              </Text>
              <TouchableOpacity style={s.proBtn}>
                <Text style={s.proBtnText}>Try Buyer Pro — $4.99/mo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 40 },
  photo: { width: SCREEN_WIDTH, height: 240 },
  photoDots: { flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.borderDark, marginHorizontal: 3 },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },
  backBtn: {
    position: 'absolute', top: SPACING.md, left: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  backText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  body: { padding: SPACING.xl },
  // Ended banner
  endedBanner: {
    backgroundColor: COLORS.warningBg, borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: COLORS.warning, marginBottom: SPACING.md,
  },
  endedText: { color: COLORS.accentDark, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  // Featured
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: SPACING.sm,
  },
  featuredText: { color: COLORS.accentDark, fontSize: 11, fontWeight: '700' },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.sm },
  // Confirmed row
  confirmedRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.successBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm, marginBottom: SPACING.lg,
  },
  confirmedText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  confirmedCount: { color: COLORS.textMuted, fontSize: 11 },
  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  infoIcon: { fontSize: 20, marginTop: 2, marginRight: SPACING.md },
  infoLabel: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  infoSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  directionsBtn: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  // Sections
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: SPACING.xl, marginBottom: SPACING.sm },
  description: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap' },
  categoryChip: {
    backgroundColor: COLORS.primaryBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primaryBorder,
    marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  categoryText: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '600' },
  itemTag: {
    backgroundColor: COLORS.bgMuted, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm, marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  itemTagText: { color: COLORS.textSecondary, fontSize: 13 },
  // Stats
  statsCard: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginTop: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'space-around',
  },
  statBox: { alignItems: 'center' },
  statValue: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  // Trust Loop
  trustRow: { flexDirection: 'row', gap: SPACING.sm },
  trustBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 2, alignItems: 'center',
  },
  trustYes: { borderColor: COLORS.success, backgroundColor: COLORS.bgCard },
  trustNo: { borderColor: COLORS.error, backgroundColor: COLORS.bgCard },
  trustYesActive: { backgroundColor: COLORS.successBg, borderColor: COLORS.success },
  trustNoActive: { backgroundColor: COLORS.errorBg, borderColor: COLORS.error },
  trustBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  trustBtnTextActive: { fontWeight: '800' },
  trustHint: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: SPACING.sm, fontStyle: 'italic' },
  // Actions
  actionRow: { flexDirection: 'row', marginTop: SPACING.xl },
  actionBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
    backgroundColor: COLORS.bgCard, marginRight: SPACING.sm,
  },
  actionBtnActive: { borderColor: COLORS.error, backgroundColor: COLORS.errorBg },
  actionBtnVisited: { borderColor: COLORS.success, backgroundColor: COLORS.successBg },
  actionBtnText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  xpHint: { color: COLORS.primary, fontSize: 12, textAlign: 'center', marginTop: SPACING.md, fontStyle: 'italic' },
  // Pro upsell
  proCard: {
    backgroundColor: COLORS.proBg, borderRadius: RADIUS.lg, padding: SPACING.xl,
    marginTop: SPACING.xxl, borderWidth: 1, borderColor: COLORS.pro + '30',
  },
  proTitle: { color: COLORS.pro, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  proDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: SPACING.lg },
  proBtn: {
    backgroundColor: COLORS.pro, paddingVertical: SPACING.md, borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  proBtnText: { color: COLORS.textInverse, fontSize: 14, fontWeight: '700' },
});
