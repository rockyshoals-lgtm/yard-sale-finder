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

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  savedSaleIds: string[];
  visitedSaleIds: string[];

  // Actions
  setProfile: (profile: UserProfile) => void;
  logout: () => void;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  toggleSaveSale: (saleId: string) => boolean; // returns new saved state
  markVisited: (saleId: string) => void;
  isSaved: (saleId: string) => boolean;
  isVisited: (saleId: string) => boolean;
  updateHuntStreak: () => void;
  addBadge: (badgeId: string) => void;
  setPreferredCategories: (cats: CategoryId[]) => void;
  setAlertRadius: (miles: number) => void;
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

      setProfile: (profile) => set({ profile, isAuthenticated: true }),

      logout: () => set({
        profile: DEFAULT_PROFILE,
        isAuthenticated: false,
        savedSaleIds: [],
        visitedSaleIds: [],
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
        const isSaved = state.savedSaleIds.includes(saleId);
        if (isSaved) {
          set({ savedSaleIds: state.savedSaleIds.filter((id) => id !== saleId) });
          return false;
        } else {
          set({ savedSaleIds: [...state.savedSaleIds, saleId] });
          // XP for saving
          get().addXP(2);
          if (state.profile) {
            set({ profile: { ...state.profile, totalSaves: state.profile.totalSaves + 1 } });
          }
          return true;
        }
      },

      markVisited: (saleId) => {
        const state = get();
        if (state.visitedSaleIds.includes(saleId)) return;
        set({ visitedSaleIds: [...state.visitedSaleIds, saleId] });
        // XP for visiting
        get().addXP(10);
        get().addCoins(5);
        if (state.profile) {
          set({ profile: { ...state.profile, totalVisits: state.profile.totalVisits + 1 } });
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
    }),
    {
      name: 'yardfind-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
