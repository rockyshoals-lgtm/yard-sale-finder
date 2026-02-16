import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { fetchSales } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import type { Sale } from '../../types';

const DEFAULT_LAT = 45.5152;
const DEFAULT_LNG = -122.6784;

export default function ListScreen({ navigation }: any) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSaved, toggleSaveSale } = useUserStore();

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

  const renderSaleCard = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={[s.card, item.isFeatured && s.cardFeatured]}
      onPress={() => navigation.navigate('SaleDetail', { sale: item })}
      activeOpacity={0.7}
    >
      {/* Photo */}
      {item.photos.length > 0 && (
        <Image source={{ uri: item.photos[0] }} style={s.cardImage} />
      )}

      <View style={s.cardBody}>
        {item.isFeatured && (
          <View style={s.featuredBadge}>
            <Text style={s.featuredText}>⭐ FEATURED</Text>
          </View>
        )}

        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>

        <Text style={s.cardMeta}>
          📅 {getDateLabel(item)} · {item.startTime}–{item.endTime}
        </Text>

        <Text style={s.cardAddress} numberOfLines={1}>
          📍 {item.address}, {item.city}, {item.state}
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
          <Text style={s.stat}>👀 {item.viewCount}</Text>
          <Text style={s.stat}>❤️ {item.saveCount}</Text>
          {item.ratingCount > 0 && (
            <Text style={s.stat}>⭐ {item.rating.toFixed(1)}</Text>
          )}
        </View>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={s.saveBtn}
        onPress={() => toggleSaveSale(item.id)}
      >
        <Text style={s.saveBtnText}>{isSaved(item.id) ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  headerCount: { color: COLORS.textMuted, fontSize: 13 },
  list: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.md },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardFeatured: { borderColor: COLORS.accent + '60', borderWidth: 2 },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: SPACING.lg, gap: 6 },
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  featuredText: { color: COLORS.accentDark, fontSize: 10, fontWeight: '700' },
  cardTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  cardMeta: { color: COLORS.textSecondary, fontSize: 13 },
  cardAddress: { color: COLORS.textMuted, fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4, flexWrap: 'wrap' },
  tag: {
    color: COLORS.textSecondary, fontSize: 11, backgroundColor: COLORS.bgMuted,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm,
  },
  tagMore: { color: COLORS.textMuted, fontSize: 11, paddingVertical: 3 },
  statsRow: { flexDirection: 'row', gap: SPACING.lg, marginTop: 6 },
  stat: { color: COLORS.textMuted, fontSize: 12 },
  saveBtn: { position: 'absolute', top: SPACING.md, right: SPACING.md, padding: SPACING.sm },
  saveBtnText: { fontSize: 22 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
});
