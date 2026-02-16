import { CategoryId } from '../theme';

// ──────────────────────────────────────
// Database / API Types
// ──────────────────────────────────────

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Sale {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  location: GeoPoint;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  startDate: string;       // ISO date
  endDate: string;         // ISO date
  startTime: string;       // HH:MM
  endTime: string;         // HH:MM
  categories: CategoryId[];
  tags: string[];           // free-form item tags like "vinyl", "tools", "mid-century"
  photos: string[];         // URLs
  isFeatured: boolean;
  isActive: boolean;
  viewCount: number;
  saveCount: number;
  visitCount: number;
  rating: number;           // 0-5
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier: 'free' | 'buyer_pro' | 'seller_pro';
  // Gamification
  xp: number;
  level: number;
  title: string;
  coins: number;
  huntStreak: number;          // consecutive weekends with ≥1 visit
  longestHuntStreak: number;
  totalVisits: number;
  totalSaves: number;
  totalSalesPosted: number;
  badges: string[];            // badge IDs
  // Preferences
  preferredCategories: CategoryId[];
  alertRadius: number;         // miles
  // Meta
  createdAt: string;
}

export interface SavedSale {
  id: string;
  userId: string;
  saleId: string;
  savedAt: string;
  note?: string;
}

export interface SaleVisit {
  id: string;
  userId: string;
  saleId: string;
  visitedAt: string;
  rating?: number;
  comment?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: string;        // human-readable
  type: 'visits' | 'streak' | 'category' | 'time' | 'social' | 'seller';
  threshold: number;
}

// ──────────────────────────────────────
// API Request/Response Types
// ──────────────────────────────────────

export interface SaleFilters {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  dateFrom?: string;
  dateTo?: string;
  categories?: CategoryId[];
  search?: string;
  featuredOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateSaleInput {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  categories: CategoryId[];
  tags: string[];
  photos: string[];
  isFeatured?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// ──────────────────────────────────────
// Monetization Types
// ──────────────────────────────────────

export type SubscriptionTier = 'free' | 'buyer_pro' | 'seller_pro';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: [
      'Browse sales on map & list',
      'Basic distance & date filters',
      '3 saved searches',
      'Ads supported',
    ],
  },
  {
    id: 'buyer_pro',
    name: 'Buyer Pro',
    price: '$4.99/mo',
    features: [
      'Unlimited smart alerts',
      'Advanced filters + saved searches',
      'Ad-free experience',
      'Early access to new sales',
      'Priority support',
    ],
  },
  {
    id: 'seller_pro',
    name: 'Seller Pro',
    price: '$9.99/mo',
    features: [
      'Featured/boosted listings',
      'Analytics dashboard (views, saves, clicks)',
      'Unlimited photo uploads',
      'Cross-posting templates',
      'Priority map placement',
    ],
  },
];
