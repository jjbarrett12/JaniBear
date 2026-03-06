/**
 * Enforce trial expiration server-side: when now() > trial_ends_at and
 * subscription is still 'trial', set trial_mode = false and billing_status = 'past_due'.
 * Call from app layout or middleware so all app areas use the same source of truth.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * If the org's trial has ended and status is still trial, update to past_due and trial_mode false.
 * Returns true if an update was performed (caller may want to re-fetch state).
 */
export async function enforceTrialExpiration(
  supabase: SupabaseClient,
  orgId: string
): Promise<boolean> {
  const { data: row } = await supabase
    .from('organizations')
    .select('id, trial_ends_at, billing_status, trial_mode')
    .eq('id', orgId)
    .single();

  if (!row) return false;

  const status = (row as { billing_status?: string }).billing_status;
  const endsAt = (row as { trial_ends_at?: string | null }).trial_ends_at;
  if (status !== 'trial' || !endsAt) return false;

  const end = new Date(endsAt);
  if (Date.now() < end.getTime()) return false;

  const { error } = await supabase
    .from('organizations')
    .update({
      trial_mode: false,
      billing_status: 'past_due',
      past_due_since: new Date().toISOString(),
    })
    .eq('id', orgId);

  return !error;
}
