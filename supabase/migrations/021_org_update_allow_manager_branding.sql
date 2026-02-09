-- Allow managers (and owners) to update organization settings, including logo and branding.
-- Previously only 'owner' could UPDATE organizations, so Dashboard Settings logo upload
-- would save the file to storage but fail when updating organizations.logo_url.

DROP POLICY IF EXISTS "Owners can update org" ON organizations;

CREATE POLICY "Owners and managers can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    get_user_org_role(id, auth.uid()) IN ('owner', 'manager')
  );

COMMENT ON POLICY "Owners and managers can update org" ON organizations IS
  'Allows saving branding (logo_url, primary_color, secondary_color) from Dashboard Settings.';
