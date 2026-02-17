import type { Badge } from '../types';

export const BADGES: Badge[] = [
  // ── Core 5 (ChatGPT spec) ──
  { id: 'first_find', name: 'First Find', description: 'Visit your first yard sale', emoji: '🔍', type: 'visits', requirement: 'Visit 1 sale', threshold: 1 },
  { id: 'early_bird', name: 'Early Bird', description: 'Visit a sale before 9 AM', emoji: '🐦', type: 'time', requirement: 'Visit before 9 AM', threshold: 1 },
  { id: 'neighborhood_explorer', name: 'Neighborhood Explorer', description: 'Visit sales in 3 different areas', emoji: '🧭', type: 'visits', requirement: 'Visit 3 geo zones', threshold: 3 },
  { id: 'saver_10', name: 'Super Saver', description: 'Save 10 sales to your list', emoji: '❤️', type: 'social', requirement: 'Save 10 sales', threshold: 10 },
  { id: 'community_helper', name: 'Community Helper', description: 'Confirm 10 sales as "Still happening"', emoji: '🤝', type: 'social', requirement: 'Confirm 10 sales', threshold: 10 },

  // ── Visit-based (extended) ──
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Visit 10 yard sales', emoji: '🗺️', type: 'visits', requirement: 'Visit 10 sales', threshold: 10 },
  { id: 'yard_veteran', name: 'Yard Veteran', description: 'Visit 50 yard sales', emoji: '🏅', type: 'visits', requirement: 'Visit 50 sales', threshold: 50 },
  { id: 'legend_100', name: 'Century Club', description: 'Visit 100 yard sales', emoji: '💯', type: 'visits', requirement: 'Visit 100 sales', threshold: 100 },

  // ── Streak-based ──
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: '3 consecutive weekends hitting sales', emoji: '⚔️', type: 'streak', requirement: '3-weekend streak', threshold: 3 },
  { id: 'streak_master', name: 'Streak Master', description: '8 consecutive weekends', emoji: '🔥', type: 'streak', requirement: '8-weekend streak', threshold: 8 },

  // ── Weekend Hunt ──
  { id: 'weekend_hunt_5', name: 'Weekend Slayer', description: 'Complete 5 stamps in one weekend', emoji: '🎯', type: 'visits', requirement: '5 stamps in a weekend', threshold: 5 },

  // ── Category-based ──
  { id: 'tool_hunter', name: 'Tool Hunter', description: 'Visit 10 sales with tools', emoji: '🔧', type: 'category', requirement: 'Visit 10 tool sales', threshold: 10 },
  { id: 'vinyl_slayer', name: 'Vinyl Slayer', description: 'Visit 10 sales with music/vinyl', emoji: '🎵', type: 'category', requirement: 'Visit 10 music sales', threshold: 10 },
  { id: 'bookworm', name: 'Bookworm', description: 'Visit 10 sales with books', emoji: '📖', type: 'category', requirement: 'Visit 10 book sales', threshold: 10 },

  // ── Seller ──
  { id: 'first_sale', name: 'First Listing', description: 'Post your first yard sale', emoji: '📋', type: 'seller', requirement: 'Post 1 sale', threshold: 1 },
];
