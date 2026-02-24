-- Accept org invite by token: add current user to org_members with invite role; respect seat limit.
CREATE OR REPLACE FUNCTION accept_org_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_limit INT;
  v_count INT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT id, org_id, email, role, expires_at, accepted_at
  INTO v_invite
  FROM org_invites
  WHERE token = p_token;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired invite');
  END IF;
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has already been used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has expired');
  END IF;

  -- Seat limit: count active members (excluding current user if already a member)
  SELECT COALESCE(o.seat_limit, 5) INTO v_limit
  FROM organizations o WHERE o.id = v_invite.org_id;
  SELECT COUNT(*)::INT INTO v_count
  FROM org_members
  WHERE org_id = v_invite.org_id AND status = 'active';
  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Organization seat limit reached');
  END IF;

  -- Insert or update membership (idempotent: if already member, just mark invite accepted)
  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_invite.org_id, v_user_id, v_invite.role, 'active')
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = v_invite.role, status = 'active';

  UPDATE org_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'org_id', v_invite.org_id);
END;
$$;

COMMENT ON FUNCTION accept_org_invite(TEXT) IS 'Accept an org invite by token. Call as authenticated user. Adds/updates org_members and marks invite accepted.';
