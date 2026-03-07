-- Dedupe and audit: link org_billing_events to Stripe event for idempotent replay and recovery.
ALTER TABLE public.org_billing_events
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;

COMMENT ON COLUMN public.org_billing_events.stripe_event_id IS 'Stripe event id (evt_xxx) when event was created by webhook; used for dedupe and recovery.';

-- Unique so the same Stripe event cannot create duplicate billing event rows (e.g. on replay).
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_billing_events_org_type_stripe_event
  ON public.org_billing_events (org_id, type, stripe_event_id)
  WHERE stripe_event_id IS NOT NULL;
