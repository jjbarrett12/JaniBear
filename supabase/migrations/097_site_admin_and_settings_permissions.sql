-- =============================================================================
-- 097: Site admin (super-admin) + settings permission keys
-- - profiles.is_site_admin (DB-backed super-admin)
-- - is_site_admin() SECURITY DEFINER: true if is_site_admin or is_platform_admin
-- - has_permission() returns true when is_site_admin() (bypass)
-- - role_permissions: settings.view, settings.profile.edit, settings.org.*,
--   settings.billing.*, settings.users.*, settings.roles.manage, settings.integrations.manage
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) profiles.is_site_admin
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_site_admin BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN profiles.is_site_admin IS 'Site owner / super-admin: bypasses RBAC and has access to everything (server actions, routes, RLS).';

-- -----------------------------------------------------------------------------
-- 2) is_site_admin() — true if current user is site admin or platform admin
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_site_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_site_admin FROM profiles WHERE id = p_user_id),
    false
  ) OR COALESCE(
    (SELECT is_platform_admin FROM profiles WHERE id = p_user_id),
    false
  );
$$;
COMMENT ON FUNCTION public.is_site_admin(UUID) IS 'True if the given user (default current) is site admin or platform admin. Use to bypass permission checks.';
GRANT EXECUTE ON FUNCTION public.is_site_admin(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3) has_permission() — return true when is_site_admin(), else existing logic
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(p_org_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN is_site_admin(auth.uid()) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM org_members m
      JOIN role_permissions rp ON rp.role = m.role
      WHERE m.org_id = p_org_id
        AND m.user_id = auth.uid()
        AND (m.status = 'active' OR m.status IS NULL)
        AND rp.permission_key = p_permission_key
    )
  END;
$$;
COMMENT ON FUNCTION public.has_permission(UUID, TEXT) IS 'True if current user is site admin OR has p_permission_key in org (via org_members.role → role_permissions).';

-- -----------------------------------------------------------------------------
-- 4) role_permissions: settings.* keys for owner, admin, org.owner, org.admin, kodiak, super_kodiak
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('owner', 'settings.view'),
  ('owner', 'settings.profile.edit'),
  ('owner', 'settings.org.view'),
  ('owner', 'settings.org.edit'),
  ('owner', 'settings.billing.view'),
  ('owner', 'settings.billing.manage'),
  ('owner', 'settings.users.view'),
  ('owner', 'settings.users.manage'),
  ('owner', 'settings.roles.manage'),
  ('owner', 'settings.integrations.manage'),
  ('admin', 'settings.view'),
  ('admin', 'settings.profile.edit'),
  ('admin', 'settings.org.view'),
  ('admin', 'settings.org.edit'),
  ('admin', 'settings.billing.view'),
  ('admin', 'settings.billing.manage'),
  ('admin', 'settings.users.view'),
  ('admin', 'settings.users.manage'),
  ('admin', 'settings.roles.manage'),
  ('admin', 'settings.integrations.manage'),
  ('org.owner', 'settings.view'),
  ('org.owner', 'settings.profile.edit'),
  ('org.owner', 'settings.org.view'),
  ('org.owner', 'settings.org.edit'),
  ('org.owner', 'settings.billing.view'),
  ('org.owner', 'settings.billing.manage'),
  ('org.owner', 'settings.users.view'),
  ('org.owner', 'settings.users.manage'),
  ('org.owner', 'settings.roles.manage'),
  ('org.owner', 'settings.integrations.manage'),
  ('org.admin', 'settings.view'),
  ('org.admin', 'settings.profile.edit'),
  ('org.admin', 'settings.org.view'),
  ('org.admin', 'settings.org.edit'),
  ('org.admin', 'settings.billing.view'),
  ('org.admin', 'settings.billing.manage'),
  ('org.admin', 'settings.users.view'),
  ('org.admin', 'settings.users.manage'),
  ('org.admin', 'settings.roles.manage'),
  ('org.admin', 'settings.integrations.manage'),
  ('super_kodiak', 'settings.view'),
  ('super_kodiak', 'settings.profile.edit'),
  ('super_kodiak', 'settings.org.view'),
  ('super_kodiak', 'settings.org.edit'),
  ('super_kodiak', 'settings.billing.view'),
  ('super_kodiak', 'settings.billing.manage'),
  ('super_kodiak', 'settings.users.view'),
  ('super_kodiak', 'settings.users.manage'),
  ('super_kodiak', 'settings.roles.manage'),
  ('super_kodiak', 'settings.integrations.manage'),
  ('kodiak', 'settings.view'),
  ('kodiak', 'settings.profile.edit'),
  ('kodiak', 'settings.org.view'),
  ('kodiak', 'settings.org.edit'),
  ('kodiak', 'settings.billing.view'),
  ('kodiak', 'settings.billing.manage'),
  ('kodiak', 'settings.users.view'),
  ('kodiak', 'settings.users.manage'),
  ('kodiak', 'settings.roles.manage'),
  ('kodiak', 'settings.integrations.manage'),
  ('manager', 'settings.view'),
  ('manager', 'settings.profile.edit'),
  ('manager', 'settings.org.view'),
  ('manager', 'settings.org.edit'),
  ('manager', 'settings.billing.view'),
  ('manager', 'settings.users.view'),
  ('super_grizzly', 'settings.view'),
  ('super_grizzly', 'settings.profile.edit'),
  ('super_grizzly', 'settings.org.view'),
  ('grizzly', 'settings.view'),
  ('grizzly', 'settings.profile.edit'),
  ('super_cub', 'settings.view'),
  ('super_cub', 'settings.profile.edit'),
  ('cub', 'settings.view'),
  ('cub', 'settings.profile.edit')
ON CONFLICT (role, permission_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 5) RLS: is_site_admin() bypass for settings-related reads
-- So site admin (or platform admin) can load org_settings / organizations when needed.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Org members can read org_settings" ON public.org_settings;
CREATE POLICY "Org members can read org_settings"
  ON public.org_settings FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

DROP POLICY IF EXISTS "Org admin can manage org_settings" ON public.org_settings;
CREATE POLICY "Org admin can manage org_settings"
  ON public.org_settings FOR ALL TO authenticated
  USING (public.has_org_role(org_id, ARRAY['owner', 'admin', 'org.owner', 'org.admin']) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin', 'org.owner', 'org.admin']) OR public.is_site_admin(auth.uid()));

-- Site admin can read any organization (for Settings and impersonation flows).
DROP POLICY IF EXISTS "Organizations select platform or member" ON organizations;
CREATE POLICY "Organizations select platform or member"
  ON organizations FOR SELECT
  USING (
    public.is_platform_admin(auth.uid())
    OR public.is_site_admin(auth.uid())
    OR public.is_org_member(id, auth.uid())
  );
