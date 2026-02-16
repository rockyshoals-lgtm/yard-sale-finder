import React, { useState, createContext, useContext, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from './src/theme';

// Screens
import MapScreen from './src/screens/Map/MapScreen';
import ListScreen from './src/screens/List/ListScreen';
import SavedScreen from './src/screens/Saved/SavedScreen';
import ProfileScreen from './src/screens/Profile/ProfileScreen';
import SaleDetailScreen from './src/screens/Detail/SaleDetailScreen';
import CreateSaleScreen from './src/screens/CreateSale/CreateSaleScreen';
import type { Sale } from './src/types';

// --- Simple navigation context (replaces react-navigation) ---
type Screen =
  | { name: 'tabs'; tab: string }
  | { name: 'SaleDetail'; params: { sale: Sale } }
  | { name: 'CreateSale' };

interface NavContextType {
  navigate: (name: string, params?: any) => void;
  goBack: () => void;
}

const NavContext = createContext<NavContextType>({
  navigate: () => {},
  goBack: () => {},
});

export const useNav = () => useContext(NavContext);

// Wrap screens to inject navigation-like prop
function wrapScreen(Component: React.ComponentType<any>, extraProps?: any) {
  return function WrappedScreen(props: any) {
    const nav = useNav();
    return <Component {...props} {...extraProps} navigation={nav} />;
  };
}

// --- Tab bar ---
const TABS = [
  { key: 'Map', label: 'Explore', emoji: '🗺️' },
  { key: 'List', label: 'List', emoji: '📋' },
  { key: 'Saved', label: 'Saved', emoji: '❤️' },
  { key: 'Profile', label: 'Profile', emoji: '👤' },
];

function TabBar({ activeTab, onSelect }: { activeTab: string; onSelect: (key: string) => void }) {
  return (
    <View style={tb.bar}>
      {TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={tb.tab}
            onPress={() => onSelect(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[tb.emoji, { opacity: active ? 1 : 0.45 }]}>{t.emoji}</Text>
            <Text style={[tb.label, active && tb.labelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    paddingBottom: 20,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  emoji: { fontSize: 22 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  labelActive: { color: COLORS.primary },
});

// --- Main App ---
export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'tabs', tab: 'Map' });
  const [activeTab, setActiveTab] = useState('Map');

  const navigate = useCallback((name: string, params?: any) => {
    if (name === 'SaleDetail') {
      setScreen({ name: 'SaleDetail', params });
    } else if (name === 'CreateSale') {
      setScreen({ name: 'CreateSale' });
    } else if (name === 'List' || name === 'Map' || name === 'Saved' || name === 'Profile') {
      setActiveTab(name);
      setScreen({ name: 'tabs', tab: name });
    }
  }, []);

  const goBack = useCallback(() => {
    setScreen({ name: 'tabs', tab: activeTab });
  }, [activeTab]);

  const nav = { navigate, goBack };

  return (
    <SafeAreaProvider>
      <NavContext.Provider value={nav}>
        <StatusBar style="dark" />
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
          {screen.name === 'tabs' && (
            <>
              <View style={{ flex: 1 }}>
                {activeTab === 'Map' && <MapScreen navigation={nav} />}
                {activeTab === 'List' && <ListScreen navigation={nav} />}
                {activeTab === 'Saved' && <SavedScreen navigation={nav} />}
                {activeTab === 'Profile' && <ProfileScreen navigation={nav} />}
              </View>
              <TabBar activeTab={activeTab} onSelect={(key) => { setActiveTab(key); }} />
            </>
          )}

          {screen.name === 'SaleDetail' && (
            <SaleDetailScreen
              navigation={nav}
              route={{ params: (screen as any).params }}
            />
          )}

          {screen.name === 'CreateSale' && (
            <CreateSaleScreen navigation={nav} />
          )}
        </View>
      </NavContext.Provider>
    </SafeAreaProvider>
  );
}
