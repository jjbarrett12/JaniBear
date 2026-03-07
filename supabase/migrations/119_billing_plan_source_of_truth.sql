-- Billing plan source of truth: org_subscriptions.plan_code is canonical.
-- Backfill org_subscriptions from organizations.plan / stripe state so all reads use one source.
-- Keep organizations.plan in sync for legacy/backward compatibility.

-- 1) Ensure plans.code has cub, grizzly, kodiak (043 may have already seeded)
INSERT INTO plans (code, org_type, tier, name, price_cents, modules)
VALUES
  ('cub', 'independent', 1, 'Cub', 0, '{}'::jsonb),
  ('grizzly', 'independent', 2, 'Grizzly', 0, '{}'::jsonb),
  ('kodiak', 'independent', 3, 'Kodiak', 0, '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 2) Backfill org_subscriptions from organizations: orgs with plan or stripe_subscription_id but no active subscription
DO $$
DECLARE
  r RECORD;
  v_plan_code TEXT;
  v_status TEXT;
BEGIN
  FOR r IN
    SELECT o.id AS org_id,
           LOWER(TRIM(COALESCE(o.plan, 'free')::TEXT)) AS plan_raw,
           o.billing_status
    FROM organizations o
    WHERE (o.plan IS NOT NULL AND o.plan != '') OR o.stripe_subscription_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM org_subscriptions s WHERE s.org_id = o.id AND s.status = 'active'
    )
  LOOP
    v_plan_code := CASE
      WHEN r.plan_raw IN ('kodiak') THEN 'kodiak'
      WHEN r.plan_raw IN ('grizzly') THEN 'grizzly'
      ELSE 'cub'
    END;
    v_status := CASE WHEN r.billing_status = 'active' THEN 'active' ELSE 'canceled' END;
    INSERT INTO org_subscriptions (org_id, plan_code, status)
    VALUES (r.org_id, v_plan_code, v_status)
    ON CONFLICT (org_id) DO UPDATE SET plan_code = EXCLUDED.plan_code, status = EXCLUDED.status;
  END LOOP;
END $$;

-- 3) Sync organizations.plan from org_subscriptions where org has active sub but plan is null/empty
UPDATE organizations o
SET plan = s.plan_code
FROM org_subscriptions s
WHERE s.org_id = o.id AND s.status = 'active'
  AND (o.plan IS NULL OR TRIM(o.plan::TEXT) = '');

COMMENT ON TABLE org_subscriptions IS 'Canonical plan source: plan_code + status. Stripe/webhook and set-plan keep this in sync; organizations.plan kept for legacy.';
