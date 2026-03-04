-- =============================================================================
-- 091: RBAC hardening — invite email binding + account_invites RLS
-- - account_invites: remove broad SELECT so only SECURITY DEFINER RPC can read (prevents token leakage).
-- - accept_org_invite: require current user's email to match invite email (prevents accepting someone else's invite).
-- - accept_account_invite: require current user's email to match invite email.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) account_invites: drop policy that let any authenticated user read all rows
-- (Tokens must not be exposed; accept_account_invite RPC reads by token only.)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read account_invites" ON account_invites;

-- No new SELECT policy: only accept_account_invite (SECURITY DEFINER) can read rows by token.
-- Org members who manage invites use app/API that inserts; list reads go through server with org-scoped RLS on accounts.

-- -----------------------------------------------------------------------------
-- 2) accept_org_invite: bind accept to invite email
-- -----------------------------------------------------------------------------
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
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL OR v_user_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User email not found');
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

  IF LOWER(TRIM(v_invite.email)) <> LOWER(TRIM(v_user_email)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite was sent to a different email address. Sign in with that account to accept.');
  END IF;

  SELECT COALESCE(o.seat_limit, 5) INTO v_limit
  FROM organizations o WHERE o.id = v_invite.org_id;
  SELECT COUNT(*)::INT INTO v_count
  FROM org_members
  WHERE org_id = v_invite.org_id AND status = 'active';
  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Organization seat limit reached');
  END IF;

  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_invite.org_id, v_user_id, v_invite.role, 'active')
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = v_invite.role, status = 'active';

  UPDATE org_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'org_id', v_invite.org_id);
END;
$$;

COMMENT ON FUNCTION accept_org_invite(TEXT) IS 'Accept an org invite by token. Call as authenticated user. Email must match invite; token single-use; expiry enforced.';

-- -----------------------------------------------------------------------------
-- 3) accept_account_invite: bind accept to invite email
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_account_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_account RECORD;
  v_user_id UUID;
  v_user_email TEXT;
  v_limit INT;
  v_count INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL OR v_user_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User email not found');
  END IF;

  SELECT id, account_id, email, role, expires_at, accepted_at
  INTO v_invite
  FROM account_invites
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

  IF LOWER(TRIM(v_invite.email)) <> LOWER(TRIM(v_user_email)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite was sent to a different email address. Sign in with that account to accept.');
  END IF;

  SELECT id, org_id INTO v_account FROM accounts WHERE id = v_invite.account_id;
  IF v_account.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Account not found');
  END IF;

  SELECT COALESCE(a.user_limit, 5) INTO v_limit FROM accounts a WHERE a.id = v_invite.account_id;
  SELECT COUNT(*)::INT INTO v_count FROM account_users WHERE account_id = v_invite.account_id AND status = 'active';
  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Account user limit reached');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM org_members WHERE org_id = v_account.org_id AND user_id = v_user_id) THEN
    INSERT INTO org_members (org_id, user_id, role, status) VALUES (v_account.org_id, v_user_id, 'client_viewer', 'active');
  END IF;

  INSERT INTO account_users (account_id, user_id, role, status)
  VALUES (v_invite.account_id, v_user_id, v_invite.role, 'active')
  ON CONFLICT (account_id, user_id) DO NOTHING;

  UPDATE account_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'account_id', v_invite.account_id);
END;
$$;

COMMENT ON FUNCTION accept_account_invite(TEXT) IS 'Accept an account invite by token. Call as authenticated user. Email must match invite; token single-use; expiry enforced.';
