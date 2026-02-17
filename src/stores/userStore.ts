import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, CategoryId } from '../types';
import { HUNTER_LEVELS } from '../theme';

function getLevelForXP(xp: number): { level: number; title: string } {
  for (let i = HUNTER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= HUNTER_LEVELS[i].xpRequired) {
      return { level: HUNTER_LEVELS[i].level, title: HUNTER_LEVELS[i].title };
    }
  }
  return { level: 0, title: HUNTER_LEVELS[0].title };
}

// ── Weekend Hunt Helpers ──

/** Get the weekend key for a given date (e.g. "2026-02-14" for Sat Feb 14) */
function getWeekendKey(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Find the Saturday of this weekend
  if (day === 0) d.setDate(d.getDate() - 1); // Sunday → Saturday
  else if (day !== 6) d.setDate(d.getDate() + (6 - day));
  return d.toISOString().split('T')[0];
}

function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ── Geo Bucketing (simple 0.02° grid ≈ 1.4 mile squares) ──
function geoBucket(lat: number, lng: number): string {
  const gridLat = Math.floor(lat / 0.02) * 0.02;
  const gridLng = Math.floor(lng / 0.02) * 0.02;
  return `${gridLat.toFixed(2)},${gridLng.toFixed(2)}`;
}

// ── Weekend Stamp Data ──
export interface WeekendStamp {
  weekendKey: string;    // "2026-02-14"
  saleIds: string[];     // sales visited this weekend
  completed: boolean;    // 5+ stamps = completed
}

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  savedSaleIds: string[];
  visitedSaleIds: string[];

  // Weekend Hunt
  weekendStamps: Record<string, WeekendStamp>;

  // Geo buckets visited (for Neighborhood Explorer badge)
  visitedGeoBuckets: string[];

  // Confirmation count (for Community Helper badge)
  confirmationCount: number;

  // Actions
  setProfile: (profile: UserProfile) => void;
  logout: () => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  toggleSaveSale: (saleId: string) => boolean;
  markVisited: (saleId: string, lat?: number, lng?: number) => void;
  isSaved: (saleId: string) => boolean;
  isVisited: (saleId: string) => boolean;
  updateHuntStreak: () => void;
  addBadge: (badgeId: string) => void;
  setPreferredCategories: (cats: CategoryId[]) => void;
  setAlertRadius: (miles: number) => void;
  incrementConfirmations: () => void;
  incrementSalesPosted: () => void;
  getCurrentWeekendStamp: () => WeekendStamp;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'demo_user',
  email: 'demo@yardfind.app',
  displayName: 'Yard Hunter',
  tier: 'free',
  xp: 0,
  level: 0,
  title: 'Newbie Hunter',
  coins: 0,
  huntStreak: 0,
  longestHuntStreak: 0,
  totalVisits: 0,
  totalSaves: 0,
  totalSalesPosted: 0,
  badges: [],
  preferredCategories: [],
  alertRadius: 10,
  createdAt: new Date().toISOString(),
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      isAuthenticated: false,
      savedSaleIds: [],
      visitedSaleIds: [],
      weekendStamps: {},
      visitedGeoBuckets: [],
      confirmationCount: 0,

      setProfile: (profile) => set({ profile, isAuthenticated: true }),

      logout: () => set({
        profile: DEFAULT_PROFILE,
        isAuthenticated: false,
        savedSaleIds: [],
        visitedSaleIds: [],
        weekendStamps: {},
        visitedGeoBuckets: [],
        confirmationCount: 0,
      }),

      addXP: (amount) => {
        const state = get();
        if (!state.profile) return;
        const newXP = state.profile.xp + amount;
        const { level, title } = getLevelForXP(newXP);
        set({
          profile: { ...state.profile, xp: newXP, level, title },
        });
      },

      addCoins: (amount) => {
        const state = get();
        if (!state.profile) return;
        set({
          profile: { ...state.profile, coins: state.profile.coins + amount },
        });
      },

      toggleSaveSale: (saleId) => {
        const state = get();
        const wasSaved = state.savedSaleIds.includes(saleId);
        if (wasSaved) {
          set({ savedSaleIds: state.savedSaleIds.filter((id) => id !== saleId) });
          return false;
        } else {
          set({ savedSaleIds: [...state.savedSaleIds, saleId] });
          get().addXP(2);
          if (state.profile) {
            const newSaves = state.profile.totalSaves + 1;
            set({ profile: { ...state.profile, totalSaves: newSaves } });
            if (newSaves >= 10) get().addBadge('saver_10');
          }
          return true;
        }
      },

      markVisited: (saleId, lat?, lng?) => {
        const state = get();
        if (state.visitedSaleIds.includes(saleId)) return;
        set({ visitedSaleIds: [...state.visitedSaleIds, saleId] });
        get().addXP(10);
        get().addCoins(5);
        if (state.profile) {
          set({ profile: { ...state.profile, totalVisits: state.profile.totalVisits + 1 } });
        }

        // Weekend stamp tracking
        const now = new Date();
        if (isWeekend(now)) {
          const key = getWeekendKey(now);
          const existing = state.weekendStamps[key] || { weekendKey: key, saleIds: [], completed: false };
          if (!existing.saleIds.includes(saleId)) {
            const updated = {
              ...existing,
              saleIds: [...existing.saleIds, saleId],
              completed: existing.saleIds.length + 1 >= 5,
            };
            set({
              weekendStamps: { ...state.weekendStamps, [key]: updated },
            });
            // Award badge if 5 stamps this weekend
            if (updated.completed && !existing.completed) {
              get().addBadge('weekend_hunt_5');
              get().addXP(50);
              get().addCoins(20);
            }
          }
        }

        // Geo bucket tracking for Neighborhood Explorer
        if (lat !== undefined && lng !== undefined) {
          const bucket = geoBucket(lat, lng);
          const buckets = get().visitedGeoBuckets;
          if (!buckets.includes(bucket)) {
            set({ visitedGeoBuckets: [...buckets, bucket] });
            // Check badge
            if (buckets.length + 1 >= 3) {
              get().addBadge('neighborhood_explorer');
            }
          }
        }

        // Check visit-count badges
        const totalVisits = (get().profile?.totalVisits || 0);
        if (totalVisits >= 1) get().addBadge('first_find');
        if (totalVisits >= 10) get().addBadge('treasure_hunter');
        if (totalVisits >= 50) get().addBadge('yard_veteran');
        if (totalVisits >= 100) get().addBadge('legend_100');

        // Early Bird badge (before 9 AM local)
        if (now.getHours() < 9) {
          get().addBadge('early_bird');
        }
      },

      isSaved: (saleId) => get().savedSaleIds.includes(saleId),
      isVisited: (saleId) => get().visitedSaleIds.includes(saleId),

      updateHuntStreak: () => {
        const state = get();
        if (!state.profile) return;
        const newStreak = state.profile.huntStreak + 1;
        set({
          profile: {
            ...state.profile,
            huntStreak: newStreak,
            longestHuntStreak: Math.max(state.profile.longestHuntStreak, newStreak),
          },
        });
        if (newStreak >= 3) get().addBadge('weekend_warrior');
        if (newStreak >= 8) get().addBadge('streak_master');
      },

      addBadge: (badgeId) => {
        const state = get();
        if (!state.profile || state.profile.badges.includes(badgeId)) return;
        set({
          profile: {
            ...state.profile,
            badges: [...state.profile.badges, badgeId],
          },
        });
        get().addXP(25);
        get().addCoins(10);
      },

      incrementConfirmations: () => {
        const state = get();
        const newCount = state.confirmationCount + 1;
        set({ confirmationCount: newCount });
        if (newCount >= 10) get().addBadge('community_helper');
      },

      incrementSalesPosted: () => {
        const state = get();
        if (!state.profile) return;
        const newCount = state.profile.totalSalesPosted + 1;
        set({
          profile: { ...state.profile, totalSalesPosted: newCount },
        });
        if (newCount >= 1) get().addBadge('first_sale');
      },

      setPreferredCategories: (cats) => {
        const state = get();
        if (!state.profile) return;
        set({ profile: { ...state.profile, preferredCategories: cats } });
      },

      setAlertRadius: (miles) => {
        const state = get();
        if (!state.profile) return;
        set({ profile: { ...state.profile, alertRadius: miles } });
      },

      getCurrentWeekendStamp: () => {
        const key = getWeekendKey(new Date());
        return get().weekendStamps[key] || { weekendKey: key, saleIds: [], completed: false };
      },
    }),
    {
      name: 'yardfind-user',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        savedSaleIds: state.savedSaleIds,
        visitedSaleIds: state.visitedSaleIds,
        weekendStamps: state.weekendStamps,
        visitedGeoBuckets: state.visitedGeoBuckets,
        confirmationCount: state.confirmationCount,
      }),
    }
  )
);
