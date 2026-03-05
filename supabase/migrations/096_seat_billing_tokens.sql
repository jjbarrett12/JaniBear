-- =============================================================================
-- 096: Seat-based billing, tokens, and org onboarding
-- - Enums: billing_status, seat_plan, lidar_tier, seat_token_status, billing_event_type, invite_status
-- - organizations: billing columns + owner_user_id
-- - org_members: extend role to include seat plans (cub, super_cub, ...)
-- - org_seat_purchases, org_seat_tokens, org_billing_events
-- - org_invites: add intended_plan, token_id, status
-- - RLS for all new tables; has_org_seat_admin() for kodiak/super_kodiak
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Enums
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE billing_status_enum AS ENUM ('trial', 'active', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE seat_plan_enum AS ENUM (
    'cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lidar_tier_enum AS ENUM ('none', 'starter', 'unlimited');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE seat_token_status_enum AS ENUM ('available', 'assigned', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_event_type_enum AS ENUM (
    'card_expiring', 'payment_failed', 'subscription_canceled',
    'past_due', 'payment_recovered', 'locked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invite_status_enum AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Organizations: billing columns + owner_user_id
-- -----------------------------------------------------------------------------
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_status billing_status_enum NOT NULL DEFAULT 'trial';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS past_due_since TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locked_since TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN organizations.billing_status IS 'trial | active | past_due | canceled';
COMMENT ON COLUMN organizations.past_due_since IS 'Set when first payment fails; cleared when paid.';
COMMENT ON COLUMN organizations.locked_since IS 'Set when past_due > 7 days; blocks app except billing.';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for subscriptions and portal.';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Current Stripe subscription ID.';

-- Backfill owner_user_id from first owner in org_members (if any)
UPDATE organizations o
SET owner_user_id = (
  SELECT user_id FROM org_members m
  WHERE m.org_id = o.id AND LOWER(m.role) IN ('owner', 'org.owner', 'super_kodiak')
  ORDER BY created_at ASC LIMIT 1
)
WHERE o.owner_user_id IS NULL;

-- -----------------------------------------------------------------------------
-- 3) org_members: allow seat plan roles (extend role check)
-- -----------------------------------------------------------------------------
-- Drop existing role check if it's restrictive; add broader check including seat plans
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'org_members_role_seat_check'
  ) THEN
    ALTER TABLE org_members ADD CONSTRAINT org_members_role_seat_check
      CHECK (role IN (
        'owner', 'admin', 'manager', 'inspector', 'client_viewer',
        'org.owner', 'org.admin', 'sales', 'ops', 'sales_rep', 'cleaner',
        'cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'
      ));
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 4) org_seat_purchases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_seat_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cub_count INT NOT NULL DEFAULT 0,
  super_cub_count INT NOT NULL DEFAULT 0,
  grizzly_count INT NOT NULL DEFAULT 0,
  super_grizzly_count INT NOT NULL DEFAULT 0,
  kodiak_count INT NOT NULL DEFAULT 0,
  super_kodiak_count INT NOT NULL DEFAULT 0,
  lidar_tier lidar_tier_enum NOT NULL DEFAULT 'none',
  monthly_total_cents INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_seat_purchases_org ON org_seat_purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_org_seat_purchases_org_id ON org_seat_purchases(org_id);

COMMENT ON TABLE org_seat_purchases IS 'Current seat purchase snapshot per org (one row per org).';

ALTER TABLE org_seat_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read org_seat_purchases"
  ON org_seat_purchases FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Kodiak/super_kodiak can manage org_seat_purchases"
  ON org_seat_purchases FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_seat_purchases.org_id AND m.user_id = auth.uid()
        AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_seat_purchases.org_id AND m.user_id = auth.uid()
        AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 5) org_seat_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_seat_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan seat_plan_enum NOT NULL,
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  status seat_token_status_enum NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_seat_tokens_org_plan_status ON org_seat_tokens(org_id, plan, status);

-- Partial unique index: at most one assigned token per user per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_seat_tokens_one_per_user
  ON org_seat_tokens(org_id, assigned_to_user_id)
  WHERE status = 'assigned';

COMMENT ON TABLE org_seat_tokens IS 'Seat inventory; one token per purchased seat. assigned_to_user_id set when distributed.';
COMMENT ON INDEX idx_org_seat_tokens_one_per_user IS 'Enforces at most one assigned token per user per org.';

ALTER TABLE org_seat_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read org_seat_tokens"
  ON org_seat_tokens FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Kodiak/super_kodiak can manage org_seat_tokens"
  ON org_seat_tokens FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_seat_tokens.org_id AND m.user_id = auth.uid()
        AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_seat_tokens.org_id AND m.user_id = auth.uid()
        AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
    )
  );

-- -----------------------------------------------------------------------------
-- 6) org_billing_events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type billing_event_type_enum NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_org_billing_events_org_created ON org_billing_events(org_id, created_at DESC);

ALTER TABLE org_billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read org_billing_events"
  ON org_billing_events FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Kodiak/super_kodiak can insert org_billing_events"
  ON org_billing_events FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members m
      WHERE m.org_id = org_billing_events.org_id AND m.user_id = auth.uid()
        AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
    )
  );

CREATE POLICY "Service role can manage org_billing_events"
  ON org_billing_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 7) org_invites: add intended_plan, token_id, status (keep existing columns)
-- -----------------------------------------------------------------------------
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS intended_plan seat_plan_enum;
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS token_id UUID REFERENCES org_seat_tokens(id) ON DELETE SET NULL;
-- If status column doesn't exist, add it; else ensure type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'org_invites' AND column_name = 'status'
  ) THEN
    ALTER TABLE org_invites ADD COLUMN status invite_status_enum NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 8) Helper: has_org_seat_admin(org_id) — true if current user is kodiak or super_kodiak (or owner/admin)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_org_seat_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members m
    WHERE m.org_id = p_org_id AND m.user_id = auth.uid()
      AND m.role IN ('kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin')
  );
$$;
COMMENT ON FUNCTION has_org_seat_admin(UUID) IS 'True if current user can manage seats and billing for the org.';
GRANT EXECUTE ON FUNCTION has_org_seat_admin(UUID) TO authenticated;
