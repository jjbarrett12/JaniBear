/**
 * Onboarding analytics: record events for TTFV and funnel analysis.
 * Event types: signup_time, import_started, file_uploaded, file_parsed,
 * platform_detected, mapping_completed, audit_viewed, import_completed,
 * first_insight_time, first_crew_invite, first_inspection, subscription_started.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type OnboardingEventType =
  | 'signup_time'
  | 'import_started'
  | 'file_uploaded'
  | 'file_parsed'
  | 'platform_detected'
  | 'mapping_completed'
  | 'audit_viewed'
  | 'import_completed'
  | 'first_insight_time'
  | 'first_crew_invite'
  | 'first_inspection'
  | 'subscription_started';

/**
 * Record an onboarding event. Safe to call from server routes; idempotent for
 * same event_type per org (we insert only; dedupe in analytics if needed).
 */
export async function recordOnboardingEvent(
  supabase: SupabaseClient,
  orgId: string,
  eventType: OnboardingEventType,
  meta?: Record<string, unknown>,
  userId?: string | null
): Promise<void> {
  await supabase.from('onboarding_events').insert({
    org_id: orgId,
    user_id: userId ?? null,
    event_type: eventType,
    meta: meta ?? {},
  });
}
