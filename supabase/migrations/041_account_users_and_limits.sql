-- Account users: allow customers (accounts) to have their own admins who can manage
-- employees, sign up, and input service schedules for that account. Enforce user_limit per account.

-- =============================================================================
-- 1. Add user_limit to accounts (from contract/plan)
-- =============================================================================
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS user_limit INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN accounts.user_limit IS 'Max number of active account users (admins) for this account; enforced when adding users.';

-- =============================================================================
-- 2. account_users: users who can access and manage a specific account
-- =============================================================================
CREATE TABLE IF NOT EXISTS account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_users_account_id ON account_users(account_id);
CREATE INDEX IF NOT EXISTS idx_account_users_user_id ON account_users(user_id);

COMMENT ON TABLE account_users IS 'Users who can log in and manage a specific account (employees, schedules, etc.). Count against account.user_limit.';

-- =============================================================================
-- 3. account_invites: invite by email (user may not exist yet)
-- =============================================================================
CREATE TABLE IF NOT EXISTS account_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'member')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_account_invites_account_id ON account_invites(account_id);
CREATE INDEX IF NOT EXISTS idx_account_invites_token ON account_invites(token);
CREATE INDEX IF NOT EXISTS idx_account_invites_email ON account_invites(account_id, email);

-- =============================================================================
-- 4. Helper: is the user an active account user for this account?
-- =============================================================================
CREATE OR REPLACE FUNCTION is_account_user(p_account_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM account_users
    WHERE account_id = p_account_id
      AND user_id = p_user_id
      AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_account_user(p_account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_account_user(p_account_id, auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_account_user(UUID, UUID) IS 'True if p_user_id is an active account_user for p_account_id.';
COMMENT ON FUNCTION is_account_user(UUID) IS 'True if current user is active account_user for p_account_id.';

-- =============================================================================
-- 5. Enforce user_limit when inserting/activating account_users
-- =============================================================================
CREATE OR REPLACE FUNCTION check_account_user_limit()
RETURNS TRIGGER AS $$
DECLARE
  lim INTEGER;
  cnt INTEGER;
BEGIN
  -- Only enforce when this row is (or is becoming) active
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR (TG_OP = 'UPDATE' AND NEW.status = 'active') THEN
    SELECT COALESCE(a.user_limit, 5) INTO lim FROM accounts a WHERE a.id = NEW.account_id;
    -- Count active users excluding current row (for UPDATE, OLD is the row being updated)
    SELECT COUNT(*)::INTEGER INTO cnt
    FROM account_users au
    WHERE au.account_id = NEW.account_id AND au.status = 'active'
      AND (TG_OP = 'INSERT' OR au.id != OLD.id);
    IF cnt >= lim THEN
      RAISE EXCEPTION 'Account user limit reached (%/%). Upgrade the account plan to add more users.', cnt, lim
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_account_user_limit ON account_users;
CREATE TRIGGER trg_check_account_user_limit
  BEFORE INSERT OR UPDATE OF status ON account_users
  FOR EACH ROW EXECUTE FUNCTION check_account_user_limit();

-- =============================================================================
-- 6. RLS: account_users
-- =============================================================================
ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

-- Org members (operator) can manage account_users for their org's accounts
DROP POLICY IF EXISTS "Org members can manage account_users for their accounts" ON account_users;
CREATE POLICY "Org members can manage account_users for their accounts"
  ON account_users FOR ALL
  USING (
    account_id IN (SELECT id FROM accounts WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)))
  )
  WITH CHECK (
    account_id IN (SELECT id FROM accounts WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)))
  );

-- Account users can read their own membership
DROP POLICY IF EXISTS "Account users can read own membership" ON account_users;
CREATE POLICY "Account users can read own membership"
  ON account_users FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- 7. RLS: account_invites
-- =============================================================================
ALTER TABLE account_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage account_invites for their accounts" ON account_invites;
CREATE POLICY "Org members can manage account_invites for their accounts"
  ON account_invites FOR ALL
  USING (
    account_id IN (SELECT id FROM accounts WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)))
  )
  WITH CHECK (
    account_id IN (SELECT id FROM accounts WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)))
  );

-- Invitees need to read their invite by token to accept (token is secret)
DROP POLICY IF EXISTS "Authenticated can read account_invites" ON account_invites;
CREATE POLICY "Authenticated can read account_invites"
  ON account_invites FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 10. Accept invite (SECURITY DEFINER so invitee can join without UPDATE on account_invites)
-- =============================================================================
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
  v_limit INT;
  v_count INT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
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

COMMENT ON FUNCTION accept_account_invite(TEXT) IS 'Accept an account invite by token. Call as authenticated user.';

-- =============================================================================
-- 8. Allow account users to read their account and its facilities (for future account-scoped UI)
-- =============================================================================
DROP POLICY IF EXISTS "Org members can read accounts" ON accounts;
CREATE POLICY "Org members or account users can read accounts"
  ON accounts FOR SELECT
  USING (
    is_org_member(org_id, auth.uid())
    OR is_account_user(id, auth.uid())
  );

DROP POLICY IF EXISTS "Org members can read facilities" ON facilities;
CREATE POLICY "Org members or account users can read facilities"
  ON facilities FOR SELECT
  USING (
    is_org_member(org_id, auth.uid())
    OR account_id IN (SELECT account_id FROM account_users WHERE user_id = auth.uid() AND status = 'active')
  );

-- =============================================================================
-- 9. updated_at trigger for account_users
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    DROP TRIGGER IF EXISTS update_account_users_updated_at ON account_users;
    CREATE TRIGGER update_account_users_updated_at
      BEFORE UPDATE ON account_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;
