-- ============================================
-- PLATFORM OWNER CONSOLE
-- platform_admins (whitelist only; NOT org role), RLS, helpers, user_activity, audit
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) platform_admins — single source of truth for platform admin access
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE platform_admins IS 'Platform superadmins only. Access to /platform/* and cross-org data. NOT an org role.';

-- Backfill from profiles.is_platform_admin so existing platform admins keep access
INSERT INTO platform_admins (user_id, note)
  SELECT id, 'Migrated from profiles.is_platform_admin'
  FROM profiles
  WHERE is_platform_admin = true
  ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) is_platform_admin() — check platform_admins table only (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = p_user_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_platform_admin(UUID) IS 'True if user is in platform_admins. Use for /platform/* and cross-org access only.';
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3) has_org_role(p_org_id, p_roles) — check role in allowed list (owner/admin/manager)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION has_org_role(p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND (status = 'active' OR status IS NULL)
      AND (
        role = ANY(p_roles)
        OR (role_enum::text = ANY(p_roles))
      )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION has_org_role(UUID, TEXT[]) IS 'True if current user is in p_org_id with one of the given roles (role or role_enum).';
GRANT EXECUTE ON FUNCTION has_org_role(UUID, TEXT[]) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) user_activity — for WAU/MAU (last_seen_at)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_org ON user_activity(org_id);

COMMENT ON TABLE user_activity IS 'Tracks last activity per user per org for WAU/MAU. Upsert from app on each request.';

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS: users can update their own rows; platform admin can read all
CREATE POLICY "Users can upsert own activity"
  ON user_activity FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admin can read all activity"
  ON user_activity FOR SELECT
  USING (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 5) platform_audit_log (optional, recommended)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_log(created_at);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin only audit log"
  ON platform_audit_log FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 6) org_invites — add created_by if missing
-- ---------------------------------------------------------------------------
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 7) RLS: platform_admins — only platform admins can read/write
-- ---------------------------------------------------------------------------
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admin only platform_admins" ON platform_admins;
CREATE POLICY "Platform admin only platform_admins"
  ON platform_admins FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- ---------------------------------------------------------------------------
-- 8) RLS: organizations — SELECT: platform or member; INSERT: platform or signup function; UPDATE: platform only
-- ---------------------------------------------------------------------------
-- Drop permissive policies that allowed broad insert/update
DROP POLICY IF EXISTS "Allow insert for new org" ON organizations;
DROP POLICY IF EXISTS "Owners can create org" ON organizations;
DROP POLICY IF EXISTS "Owners and managers can update org" ON organizations;
DROP POLICY IF EXISTS "Owners can update org" ON organizations;

-- SELECT: platform admin sees all; others see only orgs they belong to
DROP POLICY IF EXISTS "Org members can read org" ON organizations;
CREATE POLICY "Organizations select platform or member"
  ON organizations FOR SELECT
  USING (
    is_platform_admin()
    OR is_org_member(id, auth.uid())
  );

-- INSERT: only platform admin (new customer orgs created via create_org_for_signup)
CREATE POLICY "Organizations insert platform only"
  ON organizations FOR INSERT
  WITH CHECK (is_platform_admin());

-- UPDATE: only platform admin
CREATE POLICY "Organizations update platform only"
  ON organizations FOR UPDATE
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Signup: SECURITY DEFINER function so first-time user can get an org without being in platform_admins
CREATE OR REPLACE FUNCTION create_org_for_signup(org_name TEXT, owner_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  IF owner_user_id IS NULL OR owner_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  -- Only allow if user has zero org memberships (first signup)
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = owner_user_id) THEN
    RAISE EXCEPTION 'User already has an org';
  END IF;
  INSERT INTO organizations (name, status)
  VALUES (org_name, 'trialing')
  RETURNING id INTO v_org_id;
  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_org_id, owner_user_id, 'owner', 'active');
  RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION create_org_for_signup(TEXT, UUID) IS 'Called on signup only: creates org and adds user as owner. Runs as definer.';
GRANT EXECUTE ON FUNCTION create_org_for_signup(TEXT, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- 9) RLS: org_members — SELECT platform or same-org; INSERT/UPDATE/DELETE platform or org owner/admin
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own memberships" ON org_members;
DROP POLICY IF EXISTS "Owners can manage members" ON org_members;
DROP POLICY IF EXISTS "Users can add own first membership" ON org_members;

CREATE POLICY "Org members select platform or member"
  ON org_members FOR SELECT
  USING (
    is_platform_admin()
    OR user_id = auth.uid()
    OR is_org_member(org_id, auth.uid())
  );

CREATE POLICY "Org members insert platform or org admin"
  ON org_members FOR INSERT
  WITH CHECK (
    is_platform_admin()
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Org members update platform or org admin"
  ON org_members FOR UPDATE
  USING (
    is_platform_admin()
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    is_platform_admin()
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

CREATE POLICY "Org members delete platform or org admin"
  ON org_members FOR DELETE
  USING (
    is_platform_admin()
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

-- Allow new user to add themselves as first member (signup flow uses create_org_for_signup which does both; keep this for legacy path)
CREATE POLICY "Users can add own first membership"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 10) RLS: org_invites — platform full; org owner/admin for their org only
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org members can view all" ON org_invites;

CREATE POLICY "Org invites platform full"
  ON org_invites FOR ALL
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

CREATE POLICY "Org invites org admin manage own org"
  ON org_invites FOR ALL
  USING (has_org_role(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (has_org_role(org_id, ARRAY['owner', 'admin']));
