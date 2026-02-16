import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, TextInput, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES, type CategoryId } from '../../theme';
import { fetchSales } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import type { Sale, SaleFilters } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DISTANCE_OPTIONS = [1, 5, 10, 25, 50];
const DATE_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Weekend', value: 'weekend' },
  { label: 'This Week', value: 'week' },
  { label: 'All', value: 'all' },
];

// Default to Portland, OR
const DEFAULT_LAT = 45.5152;
const DEFAULT_LNG = -122.6784;

export default function MapScreen({ navigation }: any) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { isSaved, toggleSaveSale } = useUserStore();

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      let dateFrom: string | undefined;
      let dateTo: string | undefined;

      if (dateFilter === 'today') {
        dateFrom = now.toISOString().split('T')[0];
        dateTo = dateFrom;
      } else if (dateFilter === 'weekend') {
        const day = now.getDay();
        const sat = new Date(now);
        sat.setDate(now.getDate() + (6 - day));
        const sun = new Date(sat);
        sun.setDate(sat.getDate() + 1);
        dateFrom = sat.toISOString().split('T')[0];
        dateTo = sun.toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        dateFrom = now.toISOString().split('T')[0];
        const end = new Date(now);
        end.setDate(end.getDate() + 7);
        dateTo = end.toISOString().split('T')[0];
      }

      const result = await fetchSales({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LNG,
        radiusMiles,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        search: searchText || undefined,
        dateFrom,
        dateTo,
      });
      setSales(result.data);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  }, [radiusMiles, dateFilter, selectedCategories, searchText]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const toggleCategory = (catId: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const getDateLabel = (sale: Sale): string => {
    const start = new Date(sale.startDate + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (86400000));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Search Bar */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search items, categories..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={loadSales}
            returnKeyType="search"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => { setSearchText(''); }}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={[s.filterToggle, showFilters && s.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={s.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={s.filtersPanel}>
          {/* Distance */}
          <Text style={s.filterLabel}>Distance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {DISTANCE_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[s.chip, radiusMiles === d && s.chipActive]}
                onPress={() => setRadiusMiles(d)}
              >
                <Text style={[s.chipText, radiusMiles === d && s.chipTextActive]}>
                  {d} mi
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Date */}
          <Text style={s.filterLabel}>When</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {DATE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[s.chip, dateFilter === opt.value && s.chipActive]}
                onPress={() => setDateFilter(opt.value)}
              >
                <Text style={[s.chipText, dateFilter === opt.value && s.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Categories */}
          <Text style={s.filterLabel}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[s.chip, selectedCategories.includes(cat.id) && s.chipActive]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={[s.chipText, selectedCategories.includes(cat.id) && s.chipTextActive]}>
                  {cat.emoji} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map Placeholder */}
      <View style={s.mapContainer}>
        <View style={s.mapPlaceholder}>
          <Text style={s.mapEmoji}>🗺️</Text>
          <Text style={s.mapText}>Map View</Text>
          <Text style={s.mapSubtext}>
            {loading ? 'Loading sales...' : `${sales.length} sales within ${radiusMiles} miles`}
          </Text>
          <Text style={s.mapHint}>
            Connect react-native-maps for interactive pins
          </Text>

          {/* Fake pin indicators */}
          {!loading && (
            <View style={s.pinGrid}>
              {sales.slice(0, 8).map((sale, i) => (
                <TouchableOpacity
                  key={sale.id}
                  style={[s.fakePin, sale.isFeatured && s.fakePinFeatured]}
                  onPress={() => setSelectedSale(sale)}
                >
                  <Text style={s.fakePinText}>{sale.isFeatured ? '⭐' : '📍'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Bottom Card — Selected Sale or Quick List */}
      {selectedSale ? (
        <View style={s.bottomCard}>
          <TouchableOpacity
            style={s.salePreview}
            onPress={() => {
              navigation.navigate('SaleDetail', { sale: selectedSale });
              setSelectedSale(null);
            }}
          >
            <View style={s.salePreviewLeft}>
              {selectedSale.isFeatured && (
                <View style={s.featuredBadge}>
                  <Text style={s.featuredText}>⭐ FEATURED</Text>
                </View>
              )}
              <Text style={s.saleTitle} numberOfLines={1}>{selectedSale.title}</Text>
              <Text style={s.saleMeta}>
                {getDateLabel(selectedSale)} · {selectedSale.startTime}–{selectedSale.endTime}
              </Text>
              <Text style={s.saleAddress} numberOfLines={1}>
                📍 {selectedSale.address}, {selectedSale.city}
              </Text>
              <View style={s.tagRow}>
                {selectedSale.categories.slice(0, 3).map((catId) => {
                  const cat = CATEGORIES.find((c) => c.id === catId);
                  return cat ? (
                    <Text key={catId} style={s.miniTag}>{cat.emoji} {cat.label}</Text>
                  ) : null;
                })}
              </View>
            </View>
            <View style={s.salePreviewRight}>
              <TouchableOpacity onPress={() => toggleSaveSale(selectedSale.id)}>
                <Text style={s.heartBtn}>{isSaved(selectedSale.id) ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
              <Text style={s.arrowBtn}>→</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.closePreview} onPress={() => setSelectedSale(null)}>
            <Text style={s.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.bottomQuickBar}>
          <Text style={s.quickCount}>
            {loading ? '...' : `${sales.length} sales nearby`}
          </Text>
          <TouchableOpacity
            style={s.listToggleBtn}
            onPress={() => navigation.navigate('List')}
          >
            <Text style={s.listToggleText}>📋 List View</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post Sale FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('CreateSale')}
        activeOpacity={0.8}
      >
        <Text style={s.fabText}>＋ Post Sale</Text>
      </TouchableOpacity>

      {loading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  // Search
  searchRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    gap: SPACING.sm, backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bg, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md,
    height: 44, borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  clearBtn: { color: COLORS.textMuted, fontSize: 16, padding: 4 },
  filterToggle: {
    width: 44, height: 44, borderRadius: RADIUS.lg, backgroundColor: COLORS.bg,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  filterToggleActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  filterIcon: { fontSize: 20 },
  // Filters
  filtersPanel: {
    backgroundColor: COLORS.bgCard, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginTop: SPACING.sm, marginBottom: SPACING.xs, letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: COLORS.textInverse },
  // Map
  mapContainer: { flex: 1 },
  mapPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  mapEmoji: { fontSize: 56, marginBottom: SPACING.md },
  mapText: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  mapSubtext: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.xs },
  mapHint: { color: COLORS.textMuted, fontSize: 12, marginTop: SPACING.md, fontStyle: 'italic' },
  pinGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: SPACING.lg, marginTop: SPACING.xl, paddingHorizontal: SPACING.xxxl,
  },
  fakePin: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  fakePinFeatured: { borderColor: COLORS.accent, backgroundColor: COLORS.accentBg },
  fakePinText: { fontSize: 18 },
  // Bottom card
  bottomCard: {
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: SPACING.lg, paddingBottom: SPACING.xl,
  },
  salePreview: { flexDirection: 'row', justifyContent: 'space-between' },
  salePreviewLeft: { flex: 1, gap: 4 },
  salePreviewRight: { alignItems: 'center', gap: SPACING.md, paddingLeft: SPACING.md },
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start',
  },
  featuredText: { color: COLORS.accentDark, fontSize: 10, fontWeight: '700' },
  saleTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  saleMeta: { color: COLORS.textSecondary, fontSize: 13 },
  saleAddress: { color: COLORS.textMuted, fontSize: 12 },
  tagRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: 4 },
  miniTag: { color: COLORS.textSecondary, fontSize: 11, backgroundColor: COLORS.bgMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  heartBtn: { fontSize: 24 },
  arrowBtn: { color: COLORS.primary, fontSize: 24, fontWeight: '700' },
  closePreview: { position: 'absolute', top: SPACING.sm, right: SPACING.sm },
  closeText: { color: COLORS.textMuted, fontSize: 16 },
  // Quick bar
  bottomQuickBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
  },
  quickCount: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
  listToggleBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  listToggleText: { color: COLORS.textInverse, fontSize: 13, fontWeight: '700' },
  // FAB
  fab: {
    position: 'absolute', bottom: 100, right: SPACING.lg,
    backgroundColor: COLORS.accent, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  fabText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
});
