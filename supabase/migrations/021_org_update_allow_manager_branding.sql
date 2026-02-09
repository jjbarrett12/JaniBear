-- Allow managers and admins (and owners) to update organization settings, including logo and colors.
-- Previously only 'owner' could UPDATE organizations, so Dashboard Settings would fail on save.
-- Uses effective role (role_enum when set, else legacy role) so both legacy and 019+ roles work.

DROP POLICY IF EXISTS "Owners can update org" ON organizations;
DROP POLICY IF EXISTS "Owners and managers can update org" ON organizations;

CREATE POLICY "Owners and managers can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    (SELECT COALESCE(om.role_enum::text, om.role) FROM org_members om WHERE om.org_id = organizations.id AND om.user_id = auth.uid() LIMIT 1) IN ('owner', 'manager', 'op_admin', 'fr_admin')
  );

COMMENT ON POLICY "Owners and managers can update org" ON organizations IS
  'Allows saving branding (logo_url, primary_color, secondary_color) from Dashboard Settings.';
