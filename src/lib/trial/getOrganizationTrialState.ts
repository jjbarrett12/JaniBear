/**
 * 14-day full-platform trial: single source of truth for org trial state.
 * Use for dashboard banners, post-trial gate, and feature gating.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled';

export interface OrganizationTrialState {
  trialMode: boolean;
  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  currentTrialDay: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Get current trial state for an organization. Use this everywhere you need
 * trial status, days remaining, or expiration.
 */
export async function getOrganizationTrialState(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrganizationTrialState | null> {
  const { data: row, error } = await supabase
    .from('organizations')
    .select('trial_started_at, trial_ends_at, trial_mode, billing_status')
    .eq('id', orgId)
    .single();

  if (error || !row) return null;

  const trialStartedAt = (row as { trial_started_at?: string | null }).trial_started_at ?? null;
  const trialEndsAt = (row as { trial_ends_at?: string | null }).trial_ends_at ?? null;
  const trialMode = (row as { trial_mode?: boolean }).trial_mode ?? true;
  const billingStatus = String((row as { billing_status?: string }).billing_status ?? 'trial') as SubscriptionStatus;

  const now = new Date();
  const start = parseDate(trialStartedAt);
  const end = parseDate(trialEndsAt);

  let currentTrialDay = 0;
  if (start) {
    currentTrialDay = Math.max(0, daysBetween(start, now));
  }

  let daysRemaining = 0;
  let isExpired = false;
  if (end) {
    daysRemaining = Math.max(0, daysBetween(now, end));
    isExpired = now >= end;
  }

  return {
    trialMode,
    subscriptionStatus: billingStatus,
    trialStartedAt,
    trialEndsAt,
    daysRemaining,
    isExpired,
    currentTrialDay,
  };
}
