/**
 * Shared Stripe webhook idempotency and event tracking.
 * Use from both /api/stripe/webhook (billing) and /api/webhook (pro gear, etc.) to prevent duplicate processing.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Claim event for processing. Returns 'process' if new, 'skip' if already seen. */
export async function claimStripeEvent(
  supabase: SupabaseClient,
  eventId: string,
  eventType: string
): Promise<'process' | 'skip'> {
  const { data: existing } = await supabase
    .from('processed_stripe_events')
    .select('status')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) return 'skip';

  const { error } = await supabase.from('processed_stripe_events').insert({
    event_id: eventId,
    event_type: eventType,
    status: 'processing',
  });

  if (error) {
    if (error.code === '23505') return 'skip';
    throw error;
  }
  return 'process';
}

/** Mark event as processed or failed. Call after processing (success or catch). */
export async function markStripeEventProcessed(
  supabase: SupabaseClient,
  eventId: string,
  success: boolean,
  errorMessage?: string | null
): Promise<void> {
  await supabase
    .from('processed_stripe_events')
    .update({
      status: success ? 'processed' : 'failed',
      error_message: errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);
}

/** Insert org_billing_events row with stripe_event_id for dedupe and audit. Idempotent when unique (org_id, type, stripe_event_id) exists. */
export async function insertBillingEvent(
  supabase: SupabaseClient,
  params: {
    org_id: string;
    type: string;
    payload: Record<string, unknown>;
    stripe_event_id?: string | null;
  }
): Promise<{ error: unknown }> {
  const row: Record<string, unknown> = {
    org_id: params.org_id,
    type: params.type,
    payload: params.payload,
    ...(params.stripe_event_id != null && params.stripe_event_id !== '' && { stripe_event_id: params.stripe_event_id }),
  };
  const { error } = await supabase.from('org_billing_events').insert(row);
  if (error?.code === '23505') return { error: null };
  return { error: error ?? null };
}
