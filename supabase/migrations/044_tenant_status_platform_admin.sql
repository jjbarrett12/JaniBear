-- ============================================
-- TENANT STATUS & PLATFORM ADMIN (Phase 1)
-- organizations.status, profiles.is_platform_admin, org_members.status 'disabled'
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) ORGANIZATIONS (tenant) STATUS — turn off customer access at tenant level
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'status') THEN
    ALTER TABLE organizations ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trialing'));
  END IF;
END $$;

COMMENT ON COLUMN organizations.status IS 'Tenant access: active, suspended, trialing.';

-- Backfill
UPDATE organizations SET status = 'active' WHERE status IS NULL;

-- ---------------------------------------------------------------------------
-- 2) PROFILES — platform superadmin (for set-password, platform admin UI)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.is_platform_admin IS 'Platform superadmin: can manage all tenants and use service-role actions (e.g. set user password).';

-- ---------------------------------------------------------------------------
-- 3) ORG_MEMBERS — allow status 'disabled' (customer access off per user)
-- ---------------------------------------------------------------------------
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_status_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_status_check
  CHECK (status IN ('invited', 'active', 'suspended', 'disabled'));

COMMENT ON COLUMN org_members.status IS 'invited=pending; active=can access; suspended=temporary block; disabled=customer access off.';

-- is_org_member: only active (or null for backfill) counts as member; disabled/suspended do not
-- Already defined in 024: (status = 'active' OR status IS NULL). So disabled/suspended excluded. No change needed.

-- ---------------------------------------------------------------------------
-- 4) Helper: is current user a platform admin?
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM profiles WHERE id = p_user_id), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_platform_admin(UUID) IS 'True if the given user (default current) is a platform superadmin.';
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;
