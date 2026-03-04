-- Allow org members to read profiles (id, full_name, etc.) of other users in the same org.
-- Replacement for legacy 0271_* migration id.

DROP POLICY IF EXISTS "Org members can read same-org member profiles" ON profiles;
CREATE POLICY "Org members can read same-org member profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT om.user_id
      FROM org_members om
      WHERE om.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );

COMMENT ON POLICY "Org members can read same-org member profiles" ON profiles IS
  'Allows crew form and similar features to show names of other org members; same-org only.';
