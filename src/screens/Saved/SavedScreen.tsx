import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { useUserStore } from '../../stores/userStore';
import { FAKE_SALES } from '../../data/fakeSales';
import type { Sale } from '../../types';

export default function SavedScreen({ navigation }: any) {
  const { savedSaleIds, toggleSaveSale } = useUserStore();

  const savedSales = FAKE_SALES.filter((s) => savedSaleIds.includes(s.id));

  const renderSale = ({ item }: { item: Sale }) => {
    const startDate = new Date(item.startDate + 'T00:00:00');
    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('SaleDetail', { sale: item })}
        activeOpacity={0.7}
      >
        {item.photos.length > 0 && (
          <Image source={{ uri: item.photos[0] }} style={s.cardImage} />
        )}
        <View style={s.cardBody}>
          {item.isFeatured && (
            <View style={s.featuredBadge}>
              <Text style={s.featuredText}>⭐ FEATURED</Text>
            </View>
          )}
          <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={s.cardDate}>{dateStr} · {item.startTime}–{item.endTime}</Text>
          <Text style={s.cardAddress} numberOfLines={1}>
            {item.address}, {item.city}
          </Text>
          <View style={s.cardCategories}>
            {item.categories.slice(0, 3).map((catId) => {
              const cat = CATEGORIES.find((c) => c.id === catId);
              return cat ? (
                <Text key={catId} style={s.catChip}>{cat.emoji} {cat.label}</Text>
              ) : null;
            })}
          </View>
        </View>
        <TouchableOpacity
          style={s.removeBtn}
          onPress={() => toggleSaveSale(item.id)}
        >
          <Text style={s.removeText}>❤️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>Saved Sales</Text>
        <Text style={s.subtitle}>{savedSales.length} sale{savedSales.length !== 1 ? 's' : ''} saved</Text>
      </View>

      {savedSales.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🤍</Text>
          <Text style={s.emptyTitle}>No saved sales yet</Text>
          <Text style={s.emptyDesc}>
            Tap the heart icon on any sale to save it here for quick access.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedSales}
          keyExtractor={(item) => item.id}
          renderItem={renderSale}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  // Card
  card: {
    flexDirection: 'row', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  cardImage: { width: 100, height: '100%' },
  cardBody: { flex: 1, padding: SPACING.md },
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  featuredText: { color: COLORS.accentDark, fontSize: 10, fontWeight: '700' },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  cardDate: { color: COLORS.primary, fontSize: 12, fontWeight: '600', marginTop: 4 },
  cardAddress: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  cardCategories: { flexDirection: 'row', marginTop: 6 },
  catChip: { color: COLORS.primaryDark, fontSize: 11, fontWeight: '600', marginRight: 6 },
  removeBtn: {
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.md,
  },
  removeText: { fontSize: 20 },
  // Empty
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xxl },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
});
