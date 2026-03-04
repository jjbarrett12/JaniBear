-- =============================================================================
-- 090: RBAC permission model + onboarding state
-- - role_permissions (role → permission_key)
-- - has_permission(org_id, permission_key)
-- - org_settings (onboarding_status, enabled_modules, default_role_template)
-- - organizations.created_by, org_invites.invited_by
-- - Trigger: only Owner can assign Owner role (prevent privilege escalation)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) organizations: add created_by if missing
-- -----------------------------------------------------------------------------
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 2) org_invites: add invited_by if missing (alias for created_by in 051)
-- -----------------------------------------------------------------------------
ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- Backfill from created_by if that exists and invited_by is null
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_invites' AND column_name = 'created_by') THEN
    UPDATE org_invites SET invited_by = created_by WHERE invited_by IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3) role_permissions: single source of truth for role → permission
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  PRIMARY KEY (role, permission_key)
);

COMMENT ON TABLE public.role_permissions IS 'Maps org_members.role to permission keys. Enforced by has_permission().';

-- Seed: map canonical roles to permission keys (align with existing owner, admin, manager, sales, ops, inspector/cleaner, client_viewer)
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('owner', 'org.manage_users'),
  ('owner', 'org.manage_settings'),
  ('owner', 'billing.manage'),
  ('owner', 'dashboard.management.view'),
  ('owner', 'dashboard.ops.view'),
  ('owner', 'dashboard.sales.view'),
  ('owner', 'tasks.manage'),
  ('owner', 'tasks.complete'),
  ('owner', 'inspections.view'),
  ('owner', 'inspections.create'),
  ('owner', 'reports.view'),
  ('admin', 'org.manage_users'),
  ('admin', 'org.manage_settings'),
  ('admin', 'dashboard.management.view'),
  ('admin', 'dashboard.ops.view'),
  ('admin', 'dashboard.sales.view'),
  ('admin', 'tasks.manage'),
  ('admin', 'tasks.complete'),
  ('admin', 'inspections.view'),
  ('admin', 'inspections.create'),
  ('admin', 'reports.view'),
  ('manager', 'dashboard.management.view'),
  ('manager', 'dashboard.ops.view'),
  ('manager', 'dashboard.sales.view'),
  ('manager', 'tasks.manage'),
  ('manager', 'tasks.complete'),
  ('manager', 'inspections.view'),
  ('manager', 'inspections.create'),
  ('manager', 'reports.view'),
  ('sales_rep', 'dashboard.sales.view'),
  ('sales_rep', 'tasks.complete'),
  ('sales_rep', 'inspections.view'),
  ('sales', 'dashboard.sales.view'),
  ('sales', 'tasks.complete'),
  ('sales', 'inspections.view'),
  ('ops', 'dashboard.ops.view'),
  ('ops', 'tasks.manage'),
  ('ops', 'tasks.complete'),
  ('ops', 'inspections.view'),
  ('ops', 'inspections.create'),
  ('ops', 'reports.view'),
  ('inspector', 'dashboard.ops.view'),
  ('inspector', 'tasks.complete'),
  ('inspector', 'inspections.view'),
  ('inspector', 'inspections.create'),
  ('cleaner', 'tasks.complete'),
  ('cleaner', 'inspections.view'),
  ('client', 'reports.view'),
  ('client_viewer', 'reports.view')
ON CONFLICT (role, permission_key) DO NOTHING;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read role_permissions (no org_id; it's global config)
CREATE POLICY "Authenticated can read role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 4) has_permission(p_org_id, p_permission_key) — true if current user has that permission in org
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_permission(p_org_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_members m
    JOIN role_permissions rp ON rp.role = m.role
    WHERE m.org_id = p_org_id
      AND m.user_id = auth.uid()
      AND (m.status = 'active' OR m.status IS NULL)
      AND rp.permission_key = p_permission_key
  );
$$;

COMMENT ON FUNCTION public.has_permission(UUID, TEXT) IS 'True if current user has p_permission_key in org (via org_members.role → role_permissions).';
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5) org_settings: onboarding status and enabled modules per org
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  onboarding_status TEXT NOT NULL DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
  enabled_modules JSONB NOT NULL DEFAULT '{"sales": true, "ops": true, "management": true}'::jsonb,
  default_role_template TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.org_settings IS 'Per-org onboarding and feature flags. onboarding_status=completed required for full app access.';
COMMENT ON COLUMN public.org_settings.enabled_modules IS 'e.g. { "sales": true, "ops": true, "management": true }.';
CREATE INDEX IF NOT EXISTS idx_org_settings_onboarding ON public.org_settings(onboarding_status);

ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Org members can read; only owner/admin can update
CREATE POLICY "Org members can read org_settings"
  ON public.org_settings FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "Org admin can manage org_settings"
  ON public.org_settings FOR ALL TO authenticated
  USING (public.has_org_role(org_id, ARRAY['owner', 'admin']))
  WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin']));

-- -----------------------------------------------------------------------------
-- 6) Prevent privilege escalation: only Owner can set role = 'owner'
-- Trigger on org_members: before update/insert, if new role = 'owner' then actor must be owner
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_owner_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'owner' THEN
    IF NOT public.has_org_role(NEW.org_id, ARRAY['owner']) THEN
      RAISE EXCEPTION 'Only an owner can assign the owner role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_members_owner_assignment ON org_members;
CREATE TRIGGER trg_org_members_owner_assignment
  BEFORE INSERT OR UPDATE OF role ON org_members
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_owner_assignment();

-- Same for org_invites: only owner can invite as owner
CREATE OR REPLACE FUNCTION public.check_invite_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'owner' THEN
    IF NOT public.has_org_role(NEW.org_id, ARRAY['owner']) THEN
      RAISE EXCEPTION 'Only an owner can invite as owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_invites_owner_role ON org_invites;
CREATE TRIGGER trg_org_invites_owner_role
  BEFORE INSERT OR UPDATE OF role ON org_invites
  FOR EACH ROW
  EXECUTE PROCEDURE public.check_invite_owner_role();

-- -----------------------------------------------------------------------------
-- 7) audit_log: index for admin audit list
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created_desc ON public.audit_log(org_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 8) Default org_settings on new organization (so every org has a row)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_default_org_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.org_settings (org_id, onboarding_status, enabled_modules)
  VALUES (NEW.id, 'pending', '{"sales": true, "ops": true, "management": true}'::jsonb)
  ON CONFLICT (org_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_settings_on_insert ON organizations;
CREATE TRIGGER trg_org_settings_on_insert
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_default_org_settings();
