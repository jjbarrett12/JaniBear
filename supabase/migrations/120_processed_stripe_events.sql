-- Idempotency and replay protection for Stripe webhooks.
-- Store each processed event id; reject duplicates and allow recovery of failures.

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id
  ON public.processed_stripe_events (event_id);
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_status_created
  ON public.processed_stripe_events (status, created_at DESC)
  WHERE status = 'failed';

COMMENT ON TABLE public.processed_stripe_events IS 'Stripe webhook idempotency: one row per event_id. Prevents duplicate processing; failed events are logged for retry/recovery.';

-- Service role only (webhook runs with admin client).
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access processed_stripe_events"
  ON public.processed_stripe_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);
