import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { fetchSales } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { useSaleStore } from '../../stores/saleStore';
import { useXPToast } from '../../components/XPToast';
import type { Sale } from '../../types';

const DEFAULT_LAT = 45.5152;
const DEFAULT_LNG = -122.6784;

export default function ListScreen({ navigation }: any) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSaveSale } = useUserStore();
  const { isLikelyEnded, getConfirmation } = useSaleStore();
  const { showXP } = useXPToast();

  const handleToggleSave = (saleId: string) => {
    const nowSaved = toggleSaveSale(saleId);
    if (nowSaved) showXP(2);
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const result = await fetchSales({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        radiusMiles: 25,
        limit: 40,
      });
      setSales(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);

  const getDateLabel = (sale: Sale): string => {
    const start = new Date(sale.startDate + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getLastConfirmedLabel = (saleId: string): string | null => {
    const conf = getConfirmation(saleId);
    if (!conf.lastConfirmedAt) return null;
    const diff = Date.now() - new Date(conf.lastConfirmedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Confirmed just now';
    if (mins < 60) return `Confirmed ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Confirmed ${hrs}h ago`;
    return `Confirmed ${Math.floor(hrs / 24)}d ago`;
  };

  const renderSaleCard = ({ item }: { item: Sale }) => {
    const ended = isLikelyEnded(item.id);
    const confirmedLabel = getLastConfirmedLabel(item.id);

    return (
      <TouchableOpacity
        style={[s.card, item.isFeatured && s.cardFeatured, ended && s.cardEnded]}
        onPress={() => navigation.navigate('SaleDetail', { sale: item })}
        activeOpacity={0.7}
      >
        {/* Photo */}
        {item.photos.length > 0 && (
          <View>
            <Image source={{ uri: item.photos[0] }} style={s.cardImage} />
            {ended && (
              <View style={s.endedOverlay}>
                <Text style={s.endedOverlayText}>Likely Ended</Text>
              </View>
            )}
          </View>
        )}

        <View style={s.cardBody}>
          {/* Status badges row */}
          <View style={s.badgeRow}>
            {item.isFeatured && (
              <View style={s.featuredBadge}>
                <Text style={s.featuredText}>FEATURED</Text>
              </View>
            )}
            {ended && !item.photos.length && (
              <View style={s.endedBadge}>
                <Text style={s.endedBadgeText}>Likely Ended</Text>
              </View>
            )}
            {confirmedLabel && !ended && (
              <View style={s.confirmedBadge}>
                <Text style={s.confirmedBadgeText}>{confirmedLabel}</Text>
              </View>
            )}
          </View>

          <Text style={[s.cardTitle, ended && s.cardTitleEnded]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={s.cardMeta}>
            {getDateLabel(item)} | {item.startTime}-{item.endTime}
          </Text>

          <Text style={s.cardAddress} numberOfLines={1}>
            {item.address}, {item.city}, {item.state}
          </Text>

          {/* Categories */}
          <View style={s.tagRow}>
            {item.categories.slice(0, 3).map((catId) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              return cat ? (
                <Text key={catId} style={s.tag}>{cat.emoji} {cat.label}</Text>
              ) : null;
            })}
            {item.categories.length > 3 && (
              <Text style={s.tagMore}>+{item.categories.length - 3}</Text>
            )}
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <Text style={s.stat}>{item.viewCount} views</Text>
            <Text style={s.stat}>{item.saveCount} saves</Text>
            {item.ratingCount > 0 && (
              <Text style={s.stat}>{item.rating.toFixed(1)} rating</Text>
            )}
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={s.saveBtn}
          onPress={() => handleToggleSave(item.id)}
        >
          <Text style={s.saveBtnText}>{isSaved(item.id) ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Nearby Sales</Text>
        <Text style={s.headerCount}>{sales.length} found</Text>
      </View>

      <FlatList
        data={sales}
        renderItem={renderSaleCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadSales} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>🏚️</Text>
              <Text style={s.emptyText}>No sales found nearby</Text>
              <Text style={s.emptySubtext}>Try expanding your search radius or date range</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  headerCount: { color: COLORS.textMuted, fontSize: 13 },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardFeatured: { borderColor: COLORS.accent + '60', borderWidth: 2 },
  cardEnded: { opacity: 0.7 },
  cardImage: { width: '100%', height: 160 },
  endedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center',
  },
  endedOverlayText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  cardBody: { padding: SPACING.lg },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.sm, marginBottom: 4,
  },
  featuredText: { color: COLORS.accentDark, fontSize: 10, fontWeight: '700' },
  endedBadge: {
    backgroundColor: COLORS.error + '20', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.sm, marginBottom: 4,
  },
  endedBadgeText: { color: COLORS.error, fontSize: 10, fontWeight: '700' },
  confirmedBadge: {
    backgroundColor: COLORS.success + '20', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, marginRight: SPACING.sm, marginBottom: 4,
  },
  confirmedBadgeText: { color: COLORS.success, fontSize: 10, fontWeight: '600' },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  cardTitleEnded: { textDecorationLine: 'line-through', color: COLORS.textMuted },
  cardMeta: { color: COLORS.textSecondary, fontSize: 13 },
  cardAddress: { color: COLORS.textMuted, fontSize: 12 },
  tagRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap' },
  tag: {
    color: COLORS.textSecondary, fontSize: 11, backgroundColor: COLORS.bgMuted,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm, marginRight: SPACING.sm, marginBottom: 4,
  },
  tagMore: { color: COLORS.textMuted, fontSize: 11, paddingVertical: 3 },
  statsRow: { flexDirection: 'row', marginTop: 6 },
  stat: { color: COLORS.textMuted, fontSize: 12, marginRight: SPACING.lg },
  saveBtn: { position: 'absolute', top: SPACING.md, right: SPACING.md, padding: SPACING.sm },
  saveBtnText: { fontSize: 22 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
});
