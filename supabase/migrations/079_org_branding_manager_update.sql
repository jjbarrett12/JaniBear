-- Allow managers (in addition to owners) to update organization row (e.g. branding)
-- so Settings -> Save Branding Settings works for manager role.
-- Replacement for legacy 0261_* migration id.

DROP POLICY IF EXISTS "Owners can update org" ON organizations;
CREATE POLICY "Owners can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (get_user_org_role(id, auth.uid()) IN ('owner', 'manager'));

COMMENT ON POLICY "Owners can update org" ON organizations IS
  'Owner and manager can update org (e.g. branding, name)';
