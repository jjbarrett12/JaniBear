-- =============================================================================
-- 092: create_org_for_signup — optional org_type so onboarding form can set it
-- When 051/087 applied, RPC did not set org_type; fallback path in form did.
-- This allows RPC path to set org_type in one step (B3 fix).
-- =============================================================================

CREATE OR REPLACE FUNCTION create_org_for_signup(
  org_name TEXT,
  owner_user_id UUID,
  p_org_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_org_type TEXT := COALESCE(NULLIF(TRIM(LOWER(p_org_type)), ''), 'independent');
BEGIN
  IF owner_user_id IS NULL OR owner_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = owner_user_id) THEN
    RAISE EXCEPTION 'User already has an org';
  END IF;
  -- Constrain to allowed values (franchisor | franchisee | independent)
  IF v_org_type NOT IN ('franchisor', 'franchisee', 'independent') THEN
    v_org_type := 'independent';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'org_type'
  ) THEN
    INSERT INTO organizations (name, status, org_type)
    VALUES (org_name, 'trialing', v_org_type)
    RETURNING id INTO v_org_id;
  ELSE
    INSERT INTO organizations (name, status)
    VALUES (org_name, 'trialing')
    RETURNING id INTO v_org_id;
  END IF;

  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_org_id, owner_user_id, 'owner', 'active');
  RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION create_org_for_signup(TEXT, UUID, TEXT) IS 'Signup: creates org (optional org_type) and adds user as owner. Runs as definer.';
GRANT EXECUTE ON FUNCTION create_org_for_signup(TEXT, UUID, TEXT) TO authenticated;

-- Keep two-arg version for backward compatibility (calls three-arg with NULL)
CREATE OR REPLACE FUNCTION create_org_for_signup(org_name TEXT, owner_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN create_org_for_signup(org_name, owner_user_id, NULL);
END;
$$;
GRANT EXECUTE ON FUNCTION create_org_for_signup(TEXT, UUID) TO authenticated;
