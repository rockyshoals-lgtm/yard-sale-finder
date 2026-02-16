/**
 * API Service Layer
 *
 * Currently uses fake data. Designed to swap to Supabase with zero screen changes.
 * Every function returns the same shape the real API will.
 */
import { generateFakeSales } from '../data/fakeSales';
import type { Sale, SaleFilters, CreateSaleInput, PaginatedResponse } from '../types';

// Simulated network delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// In-memory fake data cache
let _salesCache: Sale[] | null = null;

function getSalesCache(lat: number, lng: number): Sale[] {
  if (!_salesCache) {
    _salesCache = generateFakeSales(lat, lng, 40);
  }
  return _salesCache;
}

// ── Public API ──

export async function fetchSales(filters: SaleFilters): Promise<PaginatedResponse<Sale>> {
  await delay(300); // simulate network
  let sales = getSalesCache(filters.latitude, filters.longitude);

  // Filter by category
  if (filters.categories && filters.categories.length > 0) {
    sales = sales.filter((s) =>
      s.categories.some((c) => filters.categories!.includes(c))
    );
  }

  // Filter by search text
  if (filters.search) {
    const q = filters.search.toLowerCase();
    sales = sales.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.description.toLowerCase().includes(q)
    );
  }

  // Filter by date
  if (filters.dateFrom) {
    sales = sales.filter((s) => s.startDate >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    sales = sales.filter((s) => s.startDate <= filters.dateTo!);
  }

  // Featured first
  if (filters.featuredOnly) {
    sales = sales.filter((s) => s.isFeatured);
  }

  const offset = filters.offset || 0;
  const limit = filters.limit || 20;
  const paginated = sales.slice(offset, offset + limit);

  return {
    data: paginated,
    total: sales.length,
    hasMore: offset + limit < sales.length,
  };
}

export async function fetchSaleById(id: string): Promise<Sale | null> {
  await delay(200);
  const all = _salesCache || [];
  return all.find((s) => s.id === id) || null;
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  await delay(500);
  const newSale: Sale = {
    id: `sale_new_${Date.now()}`,
    sellerId: 'demo_user',
    ...input,
    location: { latitude: input.latitude, longitude: input.longitude },
    isFeatured: input.isFeatured || false,
    isActive: true,
    viewCount: 0,
    saveCount: 0,
    visitCount: 0,
    rating: 0,
    ratingCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (_salesCache) {
    _salesCache.unshift(newSale);
  }

  return newSale;
}

export async function updateSale(id: string, updates: Partial<CreateSaleInput>): Promise<Sale | null> {
  await delay(300);
  if (!_salesCache) return null;
  const idx = _salesCache.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  _salesCache[idx] = { ..._salesCache[idx], ...updates, updatedAt: new Date().toISOString() };
  return _salesCache[idx];
}

export async function deleteSale(id: string): Promise<boolean> {
  await delay(300);
  if (!_salesCache) return false;
  const idx = _salesCache.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  _salesCache.splice(idx, 1);
  return true;
}

// ── Supabase Schema (for reference / future migration) ──
/*
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'buyer_pro', 'seller_pro')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 0,
  title TEXT DEFAULT 'Newbie Hunter',
  coins INTEGER DEFAULT 0,
  hunt_streak INTEGER DEFAULT 0,
  longest_hunt_streak INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  total_sales_posted INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  alert_radius INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  categories TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  visit_count INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geo index for fast nearby queries
CREATE INDEX idx_sales_location ON sales USING GIST (location);
CREATE INDEX idx_sales_dates ON sales (start_date, end_date);
CREATE INDEX idx_sales_city_state ON sales (state, city);
CREATE INDEX idx_sales_active ON sales (is_active) WHERE is_active = TRUE;

CREATE TABLE saved_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  UNIQUE(user_id, sale_id)
);

CREATE TABLE sale_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  UNIQUE(user_id, sale_id)
);

-- RPC for nearby sales (PostGIS)
CREATE OR REPLACE FUNCTION nearby_sales(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_miles INTEGER DEFAULT 10,
  cats TEXT[] DEFAULT NULL,
  date_from DATE DEFAULT NULL,
  date_to DATE DEFAULT NULL
)
RETURNS SETOF sales AS $$
  SELECT *
  FROM sales
  WHERE is_active = TRUE
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_miles * 1609.34
    )
    AND (cats IS NULL OR categories && cats)
    AND (date_from IS NULL OR start_date >= date_from)
    AND (date_to IS NULL OR start_date <= date_to)
  ORDER BY is_featured DESC, ST_Distance(
    location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  )
  LIMIT 100;
$$ LANGUAGE SQL;
*/
