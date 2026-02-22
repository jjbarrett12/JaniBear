-- Allow org owners and managers to update their own organization (logo, colors, branding).
-- Migration 051 restricted UPDATE to platform admins only, which broke Settings > Logo & branding.
-- This restores: platform admins can update any org; org members with owner/manager/op_admin/fr_admin can update their own org.

DROP POLICY IF EXISTS "Organizations update platform only" ON organizations;

CREATE POLICY "Organizations update platform or org admins"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    is_platform_admin()
    OR (
      is_org_member(id, auth.uid())
      AND (
        SELECT COALESCE(om.role_enum::text, om.role)
        FROM org_members om
        WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
        LIMIT 1
      ) IN ('owner', 'manager', 'op_admin', 'fr_admin')
    )
  )
  WITH CHECK (
    is_platform_admin()
    OR (
      is_org_member(id, auth.uid())
      AND (
        SELECT COALESCE(om.role_enum::text, om.role)
        FROM org_members om
        WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
        LIMIT 1
      ) IN ('owner', 'manager', 'op_admin', 'fr_admin')
    )
  );

COMMENT ON POLICY "Organizations update platform or org admins" ON organizations IS
  'Platform admins can update any org; org owners/managers can update their own org (logo, colors, branding in Settings).';
