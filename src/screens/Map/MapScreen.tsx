import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, TextInput, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, CATEGORIES, type CategoryId } from '../../theme';
import { fetchSales } from '../../services/api';
import { useUserStore } from '../../stores/userStore';
import { useXPToast } from '../../components/XPToast';
import type { Sale } from '../../types';

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

// Haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function generateMapHTML(
  sales: Sale[],
  userLat: number,
  userLng: number,
  radiusMiles: number,
  savedIds: string[],
): string {
  const salesJSON = JSON.stringify(sales.map(s => ({
    id: s.id,
    lat: s.location.latitude,
    lng: s.location.longitude,
    title: s.title,
    address: `${s.address}, ${s.city}`,
    featured: s.isFeatured,
    saved: savedIds.includes(s.id),
    categories: s.categories.slice(0, 3).join(', '),
    startTime: s.startTime,
    endTime: s.endTime,
    startDate: s.startDate,
  })));

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .sale-pin {
      display: flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      background: ${COLORS.primary}; border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      font-size: 16px; cursor: pointer;
      transition: transform 0.15s;
    }
    .sale-pin:hover { transform: scale(1.15); }
    .sale-pin.featured {
      background: ${COLORS.accent}; width: 42px; height: 42px;
      border: 3px solid #fff;
    }
    .sale-pin.saved { background: ${COLORS.error}; }
    .user-pin {
      width: 18px; height: 18px; border-radius: 50%;
      background: #3B82F6; border: 3px solid #fff;
      box-shadow: 0 0 0 8px rgba(59,130,246,0.2), 0 2px 6px rgba(0,0,0,0.3);
    }
    .cluster-pin {
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; background: ${COLORS.primaryDark};
      border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      color: #fff; font-weight: 700; font-family: -apple-system, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px; padding: 0; overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .leaflet-popup-content { margin: 0; min-width: 200px; }
    .popup-card { padding: 12px 14px; }
    .popup-featured {
      background: ${COLORS.accentBg}; color: ${COLORS.accentDark};
      font-size: 10px; font-weight: 700; padding: 2px 8px;
      display: inline-block; border-radius: 4px; margin-bottom: 6px;
    }
    .popup-title { font-size: 15px; font-weight: 700; color: #212529; margin-bottom: 4px; }
    .popup-meta { font-size: 12px; color: #6B7280; margin-bottom: 2px; }
    .popup-btn {
      display: block; width: 100%; padding: 10px; text-align: center;
      background: ${COLORS.primary}; color: #fff; font-weight: 700;
      font-size: 14px; border: none; cursor: pointer;
      border-top: 1px solid ${COLORS.border};
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var sales = ${salesJSON};
    var userLat = ${userLat};
    var userLng = ${userLng};
    var radius = ${radiusMiles};

    var map = L.map('map', {
      center: [userLat, userLng],
      zoom: radius <= 1 ? 15 : radius <= 5 ? 13 : radius <= 10 ? 12 : radius <= 25 ? 11 : 10,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // User location marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pin"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<div class="popup-card"><div class="popup-title">📍 You are here</div></div>');

    // Simple clustering: group sales within ~0.003 deg (~300m)
    var CLUSTER_DIST = 0.003;
    var clusters = [];
    var used = new Set();

    for (var i = 0; i < sales.length; i++) {
      if (used.has(i)) continue;
      var group = [sales[i]];
      used.add(i);
      for (var j = i + 1; j < sales.length; j++) {
        if (used.has(j)) continue;
        var dx = sales[i].lat - sales[j].lat;
        var dy = sales[i].lng - sales[j].lng;
        if (Math.sqrt(dx*dx + dy*dy) < CLUSTER_DIST) {
          group.push(sales[j]);
          used.add(j);
        }
      }
      clusters.push(group);
    }

    clusters.forEach(function(group) {
      if (group.length === 1) {
        var s = group[0];
        var cls = s.featured ? 'featured' : (s.saved ? 'saved' : '');
        var emoji = s.featured ? '⭐' : '🏷️';
        var icon = L.divIcon({
          className: '',
          html: '<div class="sale-pin ' + cls + '">' + emoji + '</div>',
          iconSize: [s.featured ? 42 : 36, s.featured ? 42 : 36],
          iconAnchor: [s.featured ? 21 : 18, s.featured ? 21 : 18],
        });
        var popup = '<div class="popup-card">' +
          (s.featured ? '<div class="popup-featured">⭐ FEATURED</div>' : '') +
          '<div class="popup-title">' + s.title.replace(/</g,'&lt;') + '</div>' +
          '<div class="popup-meta">📍 ' + s.address.replace(/</g,'&lt;') + '</div>' +
          '<div class="popup-meta">🕐 ' + s.startDate + ' · ' + s.startTime + '–' + s.endTime + '</div>' +
          '<div class="popup-meta">🏷️ ' + s.categories + '</div>' +
          '</div>' +
          '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'select\\',id:\\'' + s.id + '\\'}))">View Details →</button>';
        L.marker([s.lat, s.lng], { icon: icon }).addTo(map).bindPopup(popup);
      } else {
        // Cluster marker
        var avgLat = group.reduce(function(a,b){return a+b.lat},0) / group.length;
        var avgLng = group.reduce(function(a,b){return a+b.lng},0) / group.length;
        var size = group.length < 5 ? 40 : group.length < 10 ? 48 : 56;
        var icon = L.divIcon({
          className: '',
          html: '<div class="cluster-pin" style="width:'+size+'px;height:'+size+'px;font-size:'+(size/3)+'px">' + group.length + '</div>',
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        });
        var popup = '<div class="popup-card">' +
          '<div class="popup-title">' + group.length + ' Sales Nearby</div>' +
          group.slice(0, 3).map(function(s){
            return '<div class="popup-meta" style="cursor:pointer" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'select\\',id:\\'' + s.id + '\\'}))">' +
              (s.featured ? '⭐ ' : '🏷️ ') + s.title.replace(/</g,'&lt;').substring(0,30) + '</div>';
          }).join('') +
          (group.length > 3 ? '<div class="popup-meta">+ ' + (group.length - 3) + ' more...</div>' : '') +
          '</div>';
        L.marker([avgLat, avgLng], { icon: icon }).addTo(map).bindPopup(popup);
      }
    });

    // Recenter button message
    map.on('moveend', function() {
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapMoved', lat: c.lat, lng: c.lng
      }));
    });
  </script>
</body>
</html>`;
}

export default function MapScreen({ navigation }: any) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [userLat, setUserLat] = useState(DEFAULT_LAT);
  const [userLng, setUserLng] = useState(DEFAULT_LNG);
  const [locationReady, setLocationReady] = useState(false);
  const [mapKey, setMapKey] = useState(0); // force re-render map

  const webviewRef = useRef<WebView>(null);
  const { isSaved, toggleSaveSale, savedSaleIds } = useUserStore();
  const { showXP } = useXPToast();

  const handleToggleSave = (saleId: string) => {
    const nowSaved = toggleSaveSale(saleId);
    if (nowSaved) showXP(2);
  };

  // Get real user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLat(loc.coords.latitude);
          setUserLng(loc.coords.longitude);
        }
      } catch (e) {
        console.log('Location error, using default Portland coords:', e);
      }
      setLocationReady(true);
    })();
  }, []);

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
        latitude: userLat,
        longitude: userLng,
        radiusMiles,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        search: searchText || undefined,
        dateFrom,
        dateTo,
      });

      // Apply real haversine distance filter
      const filtered = result.data.filter((sale) => {
        const dist = haversine(userLat, userLng, sale.location.latitude, sale.location.longitude);
        return dist <= radiusMiles;
      });

      setSales(filtered);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
    }
  }, [radiusMiles, dateFilter, selectedCategories, searchText, userLat, userLng]);

  useEffect(() => {
    if (locationReady) {
      loadSales();
    }
  }, [loadSales, locationReady]);

  // Re-render map whenever sales or location changes
  useEffect(() => {
    if (!loading && locationReady) {
      setMapKey((k) => k + 1);
    }
  }, [sales, loading, locationReady]);

  const toggleCategory = (catId: CategoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const getDateLabel = (sale: Sale): string => {
    const start = new Date(sale.startDate + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.ceil((start.getTime() - now.getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getDistanceLabel = (sale: Sale): string => {
    const dist = haversine(userLat, userLng, sale.location.latitude, sale.location.longitude);
    return dist < 0.1 ? '<0.1 mi' : `${dist.toFixed(1)} mi`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'select') {
        const sale = sales.find((s) => s.id === data.id);
        if (sale) setSelectedSale(sale);
      }
    } catch (e) {
      // ignore parse errors
    }
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

      {/* Real Leaflet Map */}
      <View style={s.mapContainer}>
        {locationReady && !loading ? (
          <WebView
            key={mapKey}
            ref={webviewRef}
            originWhitelist={['*']}
            source={{ html: generateMapHTML(sales, userLat, userLng, radiusMiles, savedSaleIds) }}
            style={s.webview}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={s.loadingMap}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.loadingText}>
              {!locationReady ? 'Getting your location...' : 'Loading sales...'}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Card — Selected Sale */}
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
                📍 {selectedSale.address}, {selectedSale.city} · {getDistanceLabel(selectedSale)}
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
              <TouchableOpacity onPress={() => handleToggleSave(selectedSale.id)}>
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
            {loading ? '...' : `${sales.length} sales within ${radiusMiles} mi`}
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  // Search
  searchRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard,
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
    borderWidth: 1, borderColor: COLORS.border, marginLeft: SPACING.sm,
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
  webview: { flex: 1 },
  loadingMap: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.md },
  // Bottom card
  bottomCard: {
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border,
    padding: SPACING.lg, paddingBottom: SPACING.xl,
  },
  salePreview: { flexDirection: 'row', justifyContent: 'space-between' },
  salePreviewLeft: { flex: 1 },
  salePreviewRight: { alignItems: 'center', paddingLeft: SPACING.md },
  featuredBadge: {
    backgroundColor: COLORS.accentBg, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start',
  },
  featuredText: { color: COLORS.accentDark, fontSize: 10, fontWeight: '700' },
  saleTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  saleMeta: { color: COLORS.textSecondary, fontSize: 13 },
  saleAddress: { color: COLORS.textMuted, fontSize: 12 },
  tagRow: { flexDirection: 'row', marginTop: 4 },
  miniTag: { color: COLORS.textSecondary, fontSize: 11, backgroundColor: COLORS.bgMuted, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: SPACING.sm },
  heartBtn: { fontSize: 24, marginBottom: SPACING.md },
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
  fabText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
