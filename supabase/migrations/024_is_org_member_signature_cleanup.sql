-- ============================================
-- PRIORITY 1: Standardize is_org_member to a single implementation
-- 002 defined is_org_member(p_org_id, p_user_id); 010 defined is_org_member(org_id) with auth.uid().
-- Canonical: two-arg function; one-arg overload retained for 010 policies that call is_org_member(org_id).
-- ============================================

-- Canonical two-arg: p_org_id, p_user_id. Treat 'active' or NULL status as member (backfill-safe).
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND (status = 'active' OR status IS NULL)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
-- One-arg overload for policies that call is_org_member(org_id) (e.g. 010 foundation_update)
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_org_member(p_org_id, auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
COMMENT ON FUNCTION is_org_member(UUID, UUID) IS 'Canonical: true if p_user_id is a member of p_org_id (active or null status).';
COMMENT ON FUNCTION is_org_member(UUID) IS 'Convenience: true if current user is member of p_org_id. Calls is_org_member(p_org_id, auth.uid()).';
