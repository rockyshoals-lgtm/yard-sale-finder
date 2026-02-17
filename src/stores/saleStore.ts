/**
 * Sale Store — persists user-posted sales + trust confirmations.
 * This is the "local DB" layer that gets swapped to Supabase later.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Sale } from '../types';

// ── Trust Confirmation Types ──

export interface SaleConfirmation {
  saleId: string;
  yesCount: number;
  noCount: number;
  lastConfirmedAt: string | null;  // ISO string
  userVote: 'yes' | 'no' | null;   // this user's vote (one per sale)
}

// ── Store State ──

interface SaleStoreState {
  // User-posted sales (persisted)
  postedSales: Sale[];

  // Trust confirmations (persisted)
  confirmations: Record<string, SaleConfirmation>;

  // Actions
  addPostedSale: (sale: Sale) => void;
  confirmSale: (saleId: string, vote: 'yes' | 'no') => void;
  getConfirmation: (saleId: string) => SaleConfirmation;
  isLikelyEnded: (saleId: string) => boolean;
}

const ENDED_THRESHOLD = 3; // 3 "no" votes = likely ended

export const useSaleStore = create<SaleStoreState>()(
  persist(
    (set, get) => ({
      postedSales: [],
      confirmations: {},

      addPostedSale: (sale) => {
        set((state) => ({
          postedSales: [sale, ...state.postedSales],
        }));
      },

      confirmSale: (saleId, vote) => {
        set((state) => {
          const existing = state.confirmations[saleId] || {
            saleId,
            yesCount: 0,
            noCount: 0,
            lastConfirmedAt: null,
            userVote: null,
          };

          // If user already voted, reverse their previous vote
          if (existing.userVote === 'yes') existing.yesCount = Math.max(0, existing.yesCount - 1);
          if (existing.userVote === 'no') existing.noCount = Math.max(0, existing.noCount - 1);

          // Apply new vote
          if (vote === 'yes') {
            existing.yesCount += 1;
            existing.lastConfirmedAt = new Date().toISOString();
          } else {
            existing.noCount += 1;
          }
          existing.userVote = vote;

          return {
            confirmations: {
              ...state.confirmations,
              [saleId]: { ...existing },
            },
          };
        });
      },

      getConfirmation: (saleId) => {
        const state = get();
        return state.confirmations[saleId] || {
          saleId,
          yesCount: 0,
          noCount: 0,
          lastConfirmedAt: null,
          userVote: null,
        };
      },

      isLikelyEnded: (saleId) => {
        const conf = get().confirmations[saleId];
        if (!conf) return false;
        return conf.noCount >= ENDED_THRESHOLD;
      },
    }),
    {
      name: 'yardfind-sales',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        postedSales: state.postedSales,
        confirmations: state.confirmations,
      }),
    }
  )
);
