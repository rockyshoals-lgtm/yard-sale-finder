// YardFind Theme — Light, clean, treasure-hunt vibe
export const COLORS = {
  // Backgrounds
  bg: '#F8F9FA',
  bgCard: '#FFFFFF',
  bgCardHover: '#F1F3F5',
  bgSurface: '#FFFFFF',
  bgOverlay: 'rgba(0,0,0,0.5)',
  bgMuted: '#E9ECEF',

  // Text
  text: '#212529',
  textSecondary: '#495057',
  textMuted: '#868E96',
  textLight: '#ADB5BD',
  textInverse: '#FFFFFF',

  // Primary — Treasure Teal
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  primaryBg: '#CCFBF1',
  primaryBorder: '#99F6E4',

  // Accent — Warm Gold (finds/rewards)
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  accentBg: '#FEF3C7',

  // Success
  success: '#10B981',
  successBg: '#D1FAE5',

  // Warning
  warning: '#F59E0B',
  warningBg: '#FEF3C7',

  // Error / Danger
  error: '#EF4444',
  errorBg: '#FEE2E2',

  // Info
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Map pins
  pinDefault: '#0D9488',
  pinFeatured: '#F59E0B',
  pinVisited: '#9CA3AF',
  pinSaved: '#EF4444',

  // Pro / Premium
  pro: '#7C3AED',
  proBg: '#EDE9FE',

  // Shadows
  shadow: '#000000',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const FONTS = {
  regular: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  black: { fontWeight: 'bold' as const },
};

// Categories for yard sale items
export const CATEGORIES = [
  { id: 'furniture', label: 'Furniture', emoji: '🪑' },
  { id: 'tools', label: 'Tools', emoji: '🔧' },
  { id: 'kids', label: 'Kids & Toys', emoji: '🧸' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'collectibles', label: 'Collectibles', emoji: '🏺' },
  { id: 'books', label: 'Books & Media', emoji: '📚' },
  { id: 'sports', label: 'Sports & Outdoors', emoji: '⚾' },
  { id: 'garden', label: 'Garden & Patio', emoji: '🌱' },
  { id: 'kitchen', label: 'Kitchen', emoji: '🍳' },
  { id: 'vintage', label: 'Vintage', emoji: '📻' },
  { id: 'art', label: 'Art & Decor', emoji: '🎨' },
  { id: 'auto', label: 'Auto & Garage', emoji: '🔩' },
  { id: 'music', label: 'Music & Vinyl', emoji: '🎵' },
  { id: 'other', label: 'Other', emoji: '📦' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];

// Gamification levels
export const HUNTER_LEVELS = [
  { level: 0, title: 'Newbie Hunter', xpRequired: 0 },
  { level: 1, title: 'Curious Browser', xpRequired: 50 },
  { level: 2, title: 'Bargain Scout', xpRequired: 150 },
  { level: 3, title: 'Treasure Seeker', xpRequired: 350 },
  { level: 4, title: 'Deal Finder', xpRequired: 600 },
  { level: 5, title: 'Yard Sale Warrior', xpRequired: 1000 },
  { level: 6, title: 'Thrift Master', xpRequired: 1500 },
  { level: 7, title: 'Haggle King', xpRequired: 2200 },
  { level: 8, title: 'Garage Sale Guru', xpRequired: 3000 },
  { level: 9, title: 'Estate Legend', xpRequired: 4000 },
  { level: 10, title: 'Yard Sale L33T', xpRequired: 5500 },
];
