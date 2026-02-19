-- ============================================
-- SEED: One tenant, Cub plan + LiDAR addon, and placeholder members
-- Run after migrations 043–045. Replace YOUR_* UUIDs with real auth.users ids from Supabase Dashboard.
-- ============================================

-- 1) One tenant (organization)
INSERT INTO organizations (id, name, org_type, status, created_at)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Demo Tenant',
  'independent',
  'active',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Use a variable for the tenant id (run as a single block in Supabase SQL Editor)
DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-4000-8000-000000000001';
BEGIN
  -- 2) Cub plan subscription
  INSERT INTO org_subscriptions (org_id, plan_code, status)
  VALUES (v_tenant_id, 'cub', 'active')
  ON CONFLICT (org_id) DO UPDATE SET plan_code = 'cub', status = 'active';

  -- 3) LiDAR addon
  INSERT INTO org_addons (org_id, addon_code, status)
  VALUES (v_tenant_id, 'lidar', 'active')
  ON CONFLICT (org_id, addon_code) DO UPDATE SET status = 'active';
END $$;

-- 4) Members: run the following after creating users in Supabase Auth (Authentication → Users).
--    Copy the User UUIDs and replace YOUR_PLATFORM_ADMIN_ID, YOUR_TENANT_ADMIN_ID, YOUR_STAFF_ID, YOUR_CUSTOMER_ID.
--
-- Example (replace with your real UUIDs):
--
-- INSERT INTO profiles (id, full_name, is_platform_admin)
-- VALUES
--   ('YOUR_PLATFORM_ADMIN_ID', 'Platform Admin', true),
--   ('YOUR_TENANT_ADMIN_ID', 'Tenant Admin', false),
--   ('YOUR_STAFF_ID', 'Staff User', false),
--   ('YOUR_CUSTOMER_ID', 'Customer User', false)
-- ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_platform_admin = EXCLUDED.is_platform_admin;
--
-- INSERT INTO org_members (org_id, user_id, role, status)
-- VALUES
--   ('a0000000-0000-4000-8000-000000000001', 'YOUR_TENANT_ADMIN_ID', 'owner', 'active'),
--   ('a0000000-0000-4000-8000-000000000001', 'YOUR_STAFF_ID', 'staff', 'active'),
--   ('a0000000-0000-4000-8000-000000000001', 'YOUR_CUSTOMER_ID', 'customer', 'active')
-- ON CONFLICT (org_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status;
--
-- UPDATE profiles SET is_platform_admin = true WHERE id = 'YOUR_PLATFORM_ADMIN_ID';

-- 5) Verify effective entitlements (run after seed)
-- SELECT * FROM get_effective_entitlements('a0000000-0000-4000-8000-000000000001');
