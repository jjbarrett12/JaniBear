-- =============================================================================
-- 124: Owner/Admin org permission bypass
-- So owners and admins are never incorrectly blocked within their org.
-- Tenant isolation unchanged: membership still required; only permission result is bypassed.
-- =============================================================================

-- 1) is_org_owner_role(p_org_id): true if current user is in org with owner-equivalent role
CREATE OR REPLACE FUNCTION public.is_org_owner_role(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND (status = 'active' OR status IS NULL)
      AND LOWER(TRIM(COALESCE(role_enum::text, role))) IN ('owner', 'org.owner', 'admin', 'org.admin')
  );
$$;
COMMENT ON FUNCTION public.is_org_owner_role(UUID) IS 'True if current user is in org with owner or admin role (full org access).';
GRANT EXECUTE ON FUNCTION public.is_org_owner_role(UUID) TO authenticated;

-- 2) has_org_permission: super_admin bypass, then owner bypass for org-scoped, then gov/legacy
--    Platform permissions (platform.*) are NOT granted by owner role.
CREATE OR REPLACE FUNCTION public.has_org_permission(target_org_id UUID, required_permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Super admin: full bypass (site admin or platform admin)
    public.is_site_admin(auth.uid())
  OR
    -- Owner/admin in this org: allow any org-scoped permission (not platform.*)
    (
      public.is_org_owner_role(target_org_id)
      AND LOWER(TRIM(required_permission)) NOT LIKE 'platform.%'
    )
  OR
    -- Gov path: member_effective_permissions
    EXISTS (
      SELECT 1 FROM public.member_effective_permissions m
      WHERE m.org_id = target_org_id AND m.user_id = auth.uid() AND m.permission_key = required_permission
    )
  OR
    -- Legacy: org_members.role -> role_permissions
    EXISTS (
      SELECT 1 FROM public.org_members om
      JOIN public.role_permissions rp ON rp.role = om.role
      WHERE om.org_id = target_org_id
        AND om.user_id = auth.uid()
        AND (om.status = 'active' OR om.status IS NULL)
        AND rp.permission_key = required_permission
    );
$$;
COMMENT ON FUNCTION public.has_org_permission(UUID, TEXT) IS 'True if current user has permission in org. Owner/admin bypass for org-scoped permissions; platform.* not granted by owner.';

-- 3) Legacy role_permissions: ensure settings.ai exists for owner/admin (for non-bypass paths and consistency)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('owner', 'settings.ai'),
  ('admin', 'settings.ai'),
  ('org.owner', 'settings.ai'),
  ('org.admin', 'settings.ai')
ON CONFLICT (role, permission_key) DO NOTHING;
