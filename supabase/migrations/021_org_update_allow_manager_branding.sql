-- Allow managers and admins (and owners) to update organization settings, including logo and colors.
-- Previously only 'owner' could UPDATE organizations, so Dashboard Settings would fail on save.
-- Uses om.role only so this migration runs even if role_enum does not exist yet (e.g. before 019).

DROP POLICY IF EXISTS "Owners can update org" ON organizations;
DROP POLICY IF EXISTS "Owners and managers can update org" ON organizations;
CREATE POLICY "Owners and managers can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    (SELECT LOWER(TRIM(om.role)) FROM org_members om WHERE om.org_id = organizations.id AND om.user_id = auth.uid() LIMIT 1) IN ('owner', 'manager', 'admin', 'op_admin', 'fr_admin')
  );
COMMENT ON POLICY "Owners and managers can update org" ON organizations IS
  'Allows saving branding (logo_url, primary_color, secondary_color) from Dashboard Settings.';
