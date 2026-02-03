-- Allow new users to create their own profile (no INSERT policy existed)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to add themselves as first org member (onboarding: create org then add self as owner)
-- Without this, "Owners can manage members" blocks the insert because they are not yet a member
CREATE POLICY "Users can add own first membership"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.user_id = auth.uid())
  );
