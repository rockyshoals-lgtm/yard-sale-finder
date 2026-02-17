/**
 * Lightweight analytics wrapper — logs to console for now.
 * Swap to Mixpanel, PostHog, or Supabase analytics later.
 */

type EventName =
  | 'sale_view'
  | 'sale_save_toggle'
  | 'sale_unsave'
  | 'directions_tap'
  | 'sale_visit'
  | 'sale_confirm_yes'
  | 'sale_confirm_no'
  | 'sale_posted'
  | 'weekend_hunt_completed'
  | 'badge_earned'
  | 'level_up'
  | 'share_tap'
  | 'filter_change'
  | 'search'
  | 'app_open';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

const LOG_PREFIX = '[YardFind Analytics]';

export function track(event: EventName, data?: EventData) {
  const timestamp = new Date().toISOString();
  console.log(`${LOG_PREFIX} ${event}`, { ...data, _ts: timestamp });
}

// Convenience helpers
export const analytics = {
  saleView: (saleId: string) => track('sale_view', { saleId }),
  saleSave: (saleId: string, saved: boolean) => track(saved ? 'sale_save_toggle' : 'sale_unsave', { saleId }),
  directions: (saleId: string) => track('directions_tap', { saleId }),
  saleVisit: (saleId: string) => track('sale_visit', { saleId }),
  confirmYes: (saleId: string) => track('sale_confirm_yes', { saleId }),
  confirmNo: (saleId: string) => track('sale_confirm_no', { saleId }),
  salePosted: (saleId: string) => track('sale_posted', { saleId }),
  weekendHuntCompleted: (stamps: number) => track('weekend_hunt_completed', { stamps }),
  badgeEarned: (badgeId: string) => track('badge_earned', { badgeId }),
  levelUp: (level: number) => track('level_up', { level }),
  share: (saleId: string) => track('share_tap', { saleId }),
  search: (query: string) => track('search', { query }),
};
