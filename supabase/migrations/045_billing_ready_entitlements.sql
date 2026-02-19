-- ============================================
-- BILLING READY (Phase 5) — no Stripe yet
-- Entitlements driven by tenant_entitlements + tenant_addons; can be written by billing webhook later.
-- Optional source/audit for org_subscriptions.
-- ============================================

-- Add optional audit/source column to org_subscriptions for billing webhook idempotency
ALTER TABLE org_subscriptions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS source_of_truth TEXT;

COMMENT ON COLUMN org_subscriptions.source_of_truth IS 'e.g. stripe_subscription_id when driven by Stripe webhook';

-- Trigger to keep updated_at in sync (uses existing update_updated_at_column if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS trg_org_subscriptions_updated_at ON org_subscriptions;
    CREATE TRIGGER trg_org_subscriptions_updated_at
      BEFORE UPDATE ON org_subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
