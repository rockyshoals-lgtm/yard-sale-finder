import type { Badge } from '../types';

export const BADGES: Badge[] = [
  // Visit-based
  { id: 'first_find', name: 'First Find', description: 'Visit your first yard sale', emoji: '🔍', type: 'visits', requirement: 'Visit 1 sale', threshold: 1 },
  { id: 'treasure_hunter', name: 'Treasure Hunter', description: 'Visit 10 yard sales', emoji: '🗺️', type: 'visits', requirement: 'Visit 10 sales', threshold: 10 },
  { id: 'yard_veteran', name: 'Yard Veteran', description: 'Visit 50 yard sales', emoji: '🏅', type: 'visits', requirement: 'Visit 50 sales', threshold: 50 },
  { id: 'legend_100', name: 'Century Club', description: 'Visit 100 yard sales', emoji: '💯', type: 'visits', requirement: 'Visit 100 sales', threshold: 100 },

  // Streak-based
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: '3 consecutive weekends hitting sales', emoji: '⚔️', type: 'streak', requirement: '3-weekend streak', threshold: 3 },
  { id: 'streak_master', name: 'Streak Master', description: '8 consecutive weekends', emoji: '🔥', type: 'streak', requirement: '8-weekend streak', threshold: 8 },
  { id: 'unstoppable', name: 'Unstoppable', description: '16 consecutive weekends', emoji: '🏆', type: 'streak', requirement: '16-weekend streak', threshold: 16 },

  // Time-based
  { id: 'early_bird', name: 'Early Bird', description: 'Arrive before 8 AM five times', emoji: '🐦', type: 'time', requirement: 'Visit 5 sales before 8 AM', threshold: 5 },
  { id: 'dawn_patrol', name: 'Dawn Patrol', description: 'Arrive before 7 AM', emoji: '🌅', type: 'time', requirement: 'Visit before 7 AM', threshold: 1 },

  // Category-based
  { id: 'tool_hunter', name: 'Tool Hunter', description: 'Visit 10 sales with tools', emoji: '🔧', type: 'category', requirement: 'Visit 10 tool sales', threshold: 10 },
  { id: 'vinyl_slayer', name: 'Vinyl Slayer', description: 'Visit 10 sales with music/vinyl', emoji: '🎵', type: 'category', requirement: 'Visit 10 music sales', threshold: 10 },
  { id: 'bookworm', name: 'Bookworm', description: 'Visit 10 sales with books', emoji: '📖', type: 'category', requirement: 'Visit 10 book sales', threshold: 10 },
  { id: 'vintage_collector', name: 'Vintage Collector', description: 'Visit 10 vintage sales', emoji: '📻', type: 'category', requirement: 'Visit 10 vintage sales', threshold: 10 },
  { id: 'kid_stuff_king', name: 'Kid Stuff King', description: 'Visit 10 kids/toys sales', emoji: '🧸', type: 'category', requirement: 'Visit 10 kids sales', threshold: 10 },

  // Social
  { id: 'friendly_face', name: 'Friendly Face', description: 'Leave 5 ratings', emoji: '😊', type: 'social', requirement: 'Rate 5 sales', threshold: 5 },
  { id: 'reviewer', name: 'Top Reviewer', description: 'Leave 25 ratings', emoji: '⭐', type: 'social', requirement: 'Rate 25 sales', threshold: 25 },
  { id: 'sharer', name: 'Word Spreader', description: 'Share 5 sales with friends', emoji: '📤', type: 'social', requirement: 'Share 5 sales', threshold: 5 },

  // Seller
  { id: 'first_sale', name: 'First Listing', description: 'Post your first yard sale', emoji: '📋', type: 'seller', requirement: 'Post 1 sale', threshold: 1 },
  { id: 'power_seller', name: 'Power Seller', description: 'Post 10 yard sales', emoji: '💪', type: 'seller', requirement: 'Post 10 sales', threshold: 10 },
];
