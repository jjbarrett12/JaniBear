-- =============================================================================
-- Testing org types: create Test Franchisor, Test Franchisee, Test Independent
-- and add yourself to all three. Run in Supabase → SQL Editor.
-- Replace BOTH occurrences of YOUR_USER_ID with your auth.users id (UUID).
-- =============================================================================

-- 1) Ensure profile exists (required for org_members)
INSERT INTO profiles (id, full_name)
VALUES ('YOUR_USER_ID', 'Test User')
ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- 2) Create three organizations (one per type) if they don't exist
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Franchisor', 'franchisor'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Franchisor' AND org_type = 'franchisor');
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Franchisee', 'franchisee'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Franchisee' AND org_type = 'franchisee');
INSERT INTO organizations (id, name, org_type)
SELECT gen_random_uuid(), 'Test Independent', 'independent'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE name = 'Test Independent' AND org_type = 'independent');

-- 3) Add yourself to each org and give each a subscription (run with SQL Editor privilege)
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID';
  v_fr_id UUID; v_fe_id UUID; v_in_id UUID;
BEGIN
  SELECT id INTO v_fr_id FROM organizations WHERE name = 'Test Franchisor' AND org_type = 'franchisor' LIMIT 1;
  SELECT id INTO v_fe_id FROM organizations WHERE name = 'Test Franchisee' AND org_type = 'franchisee' LIMIT 1;
  SELECT id INTO v_in_id FROM organizations WHERE name = 'Test Independent' AND org_type = 'independent' LIMIT 1;

  IF v_fr_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_fr_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_fr_id, 'fr_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
  IF v_fe_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_fe_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_fe_id, 'op_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
  IF v_in_id IS NOT NULL THEN
    INSERT INTO org_members (org_id, user_id, role) VALUES (v_in_id, v_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status) VALUES (v_in_id, 'op_tier2', 'active')
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
END $$;
