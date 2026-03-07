-- =============================================================================
-- 114: Production-grade governance and authorization
-- - Organization structure (org_type / ownership)
-- - Franchise relationships
-- - RBAC: roles, permissions, role_permissions, member_roles, member_permissions
-- - Audit logs
-- - member_effective_permissions view
-- - SQL helpers: is_org_member, has_org_permission, is_franchisor_of
-- - Starter RLS policies (permission-based)
-- Authorization decisions use permissions, not role names.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PART 1 — ORGANIZATION STRUCTURE
-- -----------------------------------------------------------------------------
-- Add or normalize org_type for ownership model (independent | unit_franchisee | area_franchisor).
-- If column exists with operator/franchisor, add ownership_model; else add org_type.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'ownership_model') THEN
    ALTER TABLE public.organizations ADD COLUMN ownership_model TEXT NOT NULL DEFAULT 'independent'
      CHECK (ownership_model IN ('independent', 'unit_franchisee', 'area_franchisor'));
    COMMENT ON COLUMN public.organizations.ownership_model IS 'Ownership model: independent, unit_franchisee, area_franchisor. Used for franchise relationship rules.';
  END IF;
  -- Backfill from org_type if present (operator->independent, franchisor->area_franchisor)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'org_type') THEN
    UPDATE public.organizations SET ownership_model = 'area_franchisor' WHERE org_type = 'franchisor' AND (ownership_model = 'independent' OR ownership_model IS NULL);
    UPDATE public.organizations SET ownership_model = 'independent' WHERE org_type = 'operator' AND ownership_model = 'independent';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- PART 2 — FRANCHISE RELATIONSHIPS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.franchise_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisor_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  franchisee_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  territory TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(franchisor_org_id, franchisee_org_id)
);

CREATE INDEX IF NOT EXISTS idx_franchise_relationships_franchisor ON public.franchise_relationships(franchisor_org_id);
CREATE INDEX IF NOT EXISTS idx_franchise_relationships_franchisee ON public.franchise_relationships(franchisee_org_id);

-- Constrain: franchisor must be area_franchisor, franchisee must be unit_franchisee (enforced by app or trigger)
ALTER TABLE public.franchise_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisors can manage their franchise_relationships"
  ON public.franchise_relationships FOR ALL TO authenticated
  USING (
    franchisor_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL))
    OR franchisee_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL))
  );

COMMENT ON TABLE public.franchise_relationships IS 'Links area_franchisor orgs to unit_franchisee orgs for network visibility.';

-- -----------------------------------------------------------------------------
-- PART 3 — RBAC DATABASE SCHEMA (gov_ prefix to avoid clashing with legacy role_permissions)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gov_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'org',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gov_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gov_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.gov_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.gov_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.gov_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_member_id UUID NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.gov_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_member_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.gov_member_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_member_id UUID NOT NULL REFERENCES public.org_members(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.gov_permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_member_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_gov_member_roles_org_member ON public.gov_member_roles(org_member_id);
CREATE INDEX IF NOT EXISTS idx_gov_member_permissions_org_member ON public.gov_member_permissions(org_member_id);

-- -----------------------------------------------------------------------------
-- PART 4 — AUDIT LOGGING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON public.audit_logs(event_type);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own org audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)));

CREATE POLICY "Org members can insert audit_logs for own org"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)));

COMMENT ON TABLE public.audit_logs IS 'Critical action log: user_invited, role_changed, crew_assignment, proposal_approval, settings_changes, billing_changes.';

-- -----------------------------------------------------------------------------
-- PART 5 & 6 — SEED ROLES AND PERMISSIONS (idempotent: insert only if missing)
-- -----------------------------------------------------------------------------
INSERT INTO public.gov_roles (key, name, description, scope) VALUES
  ('owner', 'Owner', 'Full org control', 'org'),
  ('ops_manager', 'Ops Manager', 'Operations and crews', 'org'),
  ('sales_manager', 'Sales Manager', 'Sales and pipeline', 'org'),
  ('sales_rep', 'Sales Rep', 'Sales rep', 'org'),
  ('supervisor', 'Supervisor', 'Field supervisor', 'org'),
  ('crew_member', 'Crew Member', 'Crew member', 'org'),
  ('client_viewer', 'Client Viewer', 'Read-only client', 'org'),
  ('franchisor_admin', 'Franchisor Admin', 'Franchisor network admin', 'org'),
  ('super_admin', 'Super Admin', 'Platform super admin', 'platform')
ON CONFLICT (key) DO NOTHING;

-- Permissions by domain (key, name, domain)
INSERT INTO public.gov_permissions (key, name, domain) VALUES
  ('sales.dashboard.view', 'View sales dashboard', 'sales'),
  ('sales.leads.view', 'View leads', 'sales'),
  ('sales.leads.create', 'Create leads', 'sales'),
  ('sales.walkthroughs.create', 'Create walkthroughs', 'sales'),
  ('sales.proposals.create', 'Create proposals', 'sales'),
  ('sales.proposals.approve', 'Approve proposals', 'sales'),
  ('sales.deals.close', 'Close deals', 'sales'),
  ('launch.queue.view', 'View launch queue', 'launch'),
  ('launch.queue.accept', 'Accept launch items', 'launch'),
  ('launch.handoffs.create', 'Create handoffs', 'launch'),
  ('launch.handoffs.update', 'Update handoffs', 'launch'),
  ('ops.dashboard.view', 'View ops dashboard', 'ops'),
  ('ops.accounts.view', 'View accounts', 'ops'),
  ('ops.accounts.create', 'Create accounts', 'ops'),
  ('ops.accounts.update', 'Update accounts', 'ops'),
  ('ops.tasks.create', 'Create tasks', 'ops'),
  ('ops.tasks.update', 'Update tasks', 'ops'),
  ('ops.tasks.assign', 'Assign tasks', 'ops'),
  ('ops.crews.view', 'View crews', 'crews'),
  ('ops.crews.create', 'Create crews', 'crews'),
  ('ops.crews.update', 'Update crews', 'crews'),
  ('ops.crews.assign', 'Assign crews', 'crews'),
  ('ops.crews.replace', 'Replace crew assignments', 'crews'),
  ('ops.crews.deactivate', 'Deactivate crews', 'crews'),
  ('quality.inspections.view', 'View inspections', 'quality'),
  ('quality.inspections.create', 'Create inspections', 'quality'),
  ('quality.inspections.complete', 'Complete inspections', 'quality'),
  ('quality.issues.create', 'Create issues', 'quality'),
  ('quality.issues.resolve', 'Resolve issues', 'quality'),
  ('quality.risk.view', 'View risk', 'quality'),
  ('org.users.view', 'View users', 'org'),
  ('org.users.invite', 'Invite users', 'org'),
  ('org.users.update_role', 'Update user role', 'org'),
  ('org.settings.view', 'View settings', 'org'),
  ('org.settings.manage', 'Manage settings', 'org'),
  ('org.templates.manage', 'Manage templates', 'org'),
  ('org.integrations.manage', 'Manage integrations', 'org'),
  ('org.ai.manage', 'Manage AI settings', 'org'),
  ('billing.view', 'View billing', 'billing'),
  ('billing.subscription.manage', 'Manage subscription', 'billing'),
  ('billing.payment_methods.manage', 'Manage payment methods', 'billing'),
  ('billing.invoices.view', 'View invoices', 'billing'),
  ('billing.addons.manage', 'Manage add-ons', 'billing'),
  ('reports.view', 'View reports', 'reports'),
  ('reports.export', 'Export reports', 'reports'),
  ('financials.view', 'View financials', 'financials'),
  ('financials.manage', 'Manage financials', 'financials'),
  ('franchise.network.view', 'View franchise network', 'franchise'),
  ('franchise.network.audit', 'Audit franchise network', 'franchise'),
  ('franchise.franchisees.manage', 'Manage franchisees', 'franchise'),
  ('platform.orgs.view', 'View orgs (platform)', 'platform'),
  ('platform.orgs.manage', 'Manage orgs (platform)', 'platform'),
  ('platform.users.impersonate', 'Impersonate users', 'platform'),
  ('platform.billing.adjust', 'Adjust billing (platform)', 'platform'),
  ('platform.settings.manage', 'Manage platform settings', 'platform'),
  ('platform.audit.view', 'View platform audit', 'platform')
ON CONFLICT (key) DO NOTHING;

-- Role–permission mapping (owner gets broad org/sales/ops/quality/launch/billing/reports/financials; super_admin gets platform)
DO $$
DECLARE
  r RECORD;
  pid UUID;
BEGIN
  FOR r IN SELECT id, key FROM public.gov_roles LOOP
    IF r.key = 'owner' THEN
      FOR pid IN SELECT id FROM public.gov_permissions WHERE domain IN ('sales','launch','ops','crews','quality','org','billing','reports','financials') LOOP
        INSERT INTO public.gov_role_permissions (role_id, permission_id) VALUES (r.id, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    ELSIF r.key = 'ops_manager' THEN
      FOR pid IN SELECT id FROM public.gov_permissions WHERE domain IN ('ops','crews','quality','launch') OR (domain = 'org' AND key IN ('org.users.view','org.settings.view')) LOOP
        INSERT INTO public.gov_role_permissions (role_id, permission_id) VALUES (r.id, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    ELSIF r.key = 'sales_manager' THEN
      FOR pid IN SELECT id FROM public.gov_permissions WHERE domain IN ('sales','launch') LOOP
        INSERT INTO public.gov_role_permissions (role_id, permission_id) VALUES (r.id, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    ELSIF r.key = 'sales_rep' THEN
      FOR pid IN SELECT id FROM public.gov_permissions WHERE key IN ('sales.dashboard.view','sales.leads.view','sales.leads.create','sales.walkthroughs.create','sales.proposals.create','sales.deals.close','launch.queue.view','launch.queue.accept') LOOP
        INSERT INTO public.gov_role_permissions (role_id, permission_id) VALUES (r.id, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    ELSIF r.key = 'super_admin' THEN
      FOR pid IN SELECT id FROM public.gov_permissions WHERE domain = 'platform' LOOP
        INSERT INTO public.gov_role_permissions (role_id, permission_id) VALUES (r.id, pid) ON CONFLICT (role_id, permission_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- PART 7 — MEMBER EFFECTIVE PERMISSIONS VIEW
-- Combines: permissions from roles (gov_member_roles → gov_role_permissions → gov_permissions)
--           plus direct grants/revokes (gov_member_permissions).
-- Output: (org_id, user_id, permission_key). Revokes (granted=false) take precedence.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.member_effective_permissions AS
SELECT DISTINCT m.org_id, m.user_id, p.key AS permission_key
FROM public.org_members m
JOIN public.gov_member_roles mr ON mr.org_member_id = m.id
JOIN public.gov_role_permissions rp ON rp.role_id = mr.role_id
JOIN public.gov_permissions p ON p.id = rp.permission_id
WHERE (m.status = 'active' OR m.status IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.gov_member_permissions mp
    JOIN public.gov_permissions p2 ON p2.id = mp.permission_id AND p2.key = p.key
    WHERE mp.org_member_id = m.id AND mp.granted = false
  )
UNION
SELECT m.org_id, m.user_id, p.key AS permission_key
FROM public.org_members m
JOIN public.gov_member_permissions mp ON mp.org_member_id = m.id AND mp.granted = true
JOIN public.gov_permissions p ON p.id = mp.permission_id
WHERE (m.status = 'active' OR m.status IS NULL);

COMMENT ON VIEW public.member_effective_permissions IS 'Effective permissions per (org_id, user_id): from roles plus direct grants; direct revoke excludes.';

-- -----------------------------------------------------------------------------
-- PART 8 — SQL HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
-- is_org_member(target_org_id): already exists (024). Ensure overload for RLS.
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = target_org_id AND user_id = auth.uid() AND (status = 'active' OR status IS NULL)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID, target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = target_org_id AND user_id = target_user_id AND (status = 'active' OR status IS NULL)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- has_org_permission(target_org_id, required_permission): true if current user has permission in org (gov_ view) or legacy role_permissions
CREATE OR REPLACE FUNCTION public.has_org_permission(target_org_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_effective_permissions m
    WHERE m.org_id = target_org_id AND m.user_id = auth.uid() AND m.permission_key = required_permission
  )
  OR EXISTS (
    SELECT 1 FROM public.org_members om
    JOIN public.role_permissions rp ON rp.role = om.role
    WHERE om.org_id = target_org_id AND om.user_id = auth.uid() AND (om.status = 'active' OR om.status IS NULL) AND rp.permission_key = required_permission
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.has_org_permission(UUID, TEXT) IS 'True if current user has required_permission in org (gov RBAC or legacy role_permissions).';

GRANT EXECUTE ON FUNCTION public.has_org_permission(UUID, TEXT) TO authenticated;

-- Keep existing has_permission RPC in sync: also check gov member_effective_permissions (used by app/API).
CREATE OR REPLACE FUNCTION public.has_permission(p_org_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_org_permission(p_org_id, p_permission_key);
$$;
COMMENT ON FUNCTION public.has_permission(UUID, TEXT) IS 'True if current user has permission in org. Delegates to has_org_permission (gov + legacy).';

-- -----------------------------------------------------------------------------
-- PART 9 — FRANCHISE ACCESS: is_franchisor_of(target_franchisee_org)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_franchisor_of(target_franchisee_org UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.franchise_relationships fr
    JOIN public.org_members om ON om.org_id = fr.franchisor_org_id AND om.user_id = auth.uid() AND (om.status = 'active' OR om.status IS NULL)
    WHERE fr.franchisee_org_id = target_franchisee_org
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.is_franchisor_of(UUID) IS 'True if current user belongs to a franchisor org that has a franchise relationship to target_franchisee_org.';
GRANT EXECUTE ON FUNCTION public.is_franchisor_of(UUID) TO authenticated;

-- Return current user's effective permission keys for an org (gov + legacy).
CREATE OR REPLACE FUNCTION public.get_my_permissions_for_org(p_org_id UUID)
RETURNS SETOF TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT permission_key FROM (
    SELECT m.permission_key FROM public.member_effective_permissions m
    WHERE m.org_id = p_org_id AND m.user_id = auth.uid()
    UNION
    SELECT rp.permission_key FROM public.org_members om
    JOIN public.role_permissions rp ON rp.role = om.role
    WHERE om.org_id = p_org_id AND om.user_id = auth.uid() AND (om.status = 'active' OR om.status IS NULL)
  ) u;
$$;
COMMENT ON FUNCTION public.get_my_permissions_for_org(UUID) IS 'Returns permission keys for current user in org (gov + legacy role_permissions).';
GRANT EXECUTE ON FUNCTION public.get_my_permissions_for_org(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- RLS for gov_ tables (read by members; write by users with org.users.update_role or similar — simplified: org owner/admin)
-- -----------------------------------------------------------------------------
ALTER TABLE public.gov_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_member_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read gov_roles" ON public.gov_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read gov_permissions" ON public.gov_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read gov_role_permissions" ON public.gov_role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Org members read gov_member_roles for own org"
  ON public.gov_member_roles FOR SELECT TO authenticated
  USING (org_member_id IN (SELECT id FROM public.org_members WHERE user_id = auth.uid() OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())));

CREATE POLICY "Org admin manage gov_member_roles"
  ON public.gov_member_roles FOR ALL TO authenticated
  USING (org_member_id IN (SELECT id FROM public.org_members WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'org.owner', 'org.admin'))))
  WITH CHECK (org_member_id IN (SELECT id FROM public.org_members WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'org.owner', 'org.admin'))));

CREATE POLICY "Org members read gov_member_permissions for own org"
  ON public.gov_member_permissions FOR SELECT TO authenticated
  USING (org_member_id IN (SELECT id FROM public.org_members WHERE user_id = auth.uid() OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())));

CREATE POLICY "Org admin manage gov_member_permissions"
  ON public.gov_member_permissions FOR ALL TO authenticated
  USING (org_member_id IN (SELECT id FROM public.org_members WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'org.owner', 'org.admin'))))
  WITH CHECK (org_member_id IN (SELECT id FROM public.org_members WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'org.owner', 'org.admin'))));

-- -----------------------------------------------------------------------------
-- PART 12 — STARTER RLS: Franchisor read-only access to franchisee data
-- Helper: return current user's franchisor org_id when viewing a franchisee (for permission check).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_franchisor_org_for_franchisee(p_franchisee_org_id UUID)
RETURNS UUID AS $$
  SELECT fr.franchisor_org_id FROM public.franchise_relationships fr
  JOIN public.org_members om ON om.org_id = fr.franchisor_org_id AND om.user_id = auth.uid() AND (om.status = 'active' OR om.status IS NULL)
  WHERE fr.franchisee_org_id = p_franchisee_org_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
GRANT EXECUTE ON FUNCTION public.get_franchisor_org_for_franchisee(UUID) TO authenticated;

-- Accounts: add franchisor read-only (existing org member policies remain). Idempotent.
DROP POLICY IF EXISTS "Gov accounts select member or franchisor" ON public.accounts;
CREATE POLICY "Gov accounts select member or franchisor"
  ON public.accounts FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id, auth.uid())
    OR (public.is_franchisor_of(org_id) AND public.has_org_permission(public.get_franchisor_org_for_franchisee(org_id), 'franchise.network.view'))
  );

-- Crews: add franchisor read-only
DROP POLICY IF EXISTS "Gov crews select member or franchisor" ON public.crews;
CREATE POLICY "Gov crews select member or franchisor"
  ON public.crews FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id, auth.uid())
    OR (public.is_franchisor_of(org_id) AND public.has_org_permission(public.get_franchisor_org_for_franchisee(org_id), 'franchise.network.view'))
  );

-- Proposals (lead-linked): add franchisor read-only
DROP POLICY IF EXISTS "Gov proposals select member or franchisor" ON public.proposals;
CREATE POLICY "Gov proposals select member or franchisor"
  ON public.proposals FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id, auth.uid())
    OR (public.is_franchisor_of(org_id) AND public.has_org_permission(public.get_franchisor_org_for_franchisee(org_id), 'franchise.network.view'))
  );

-- Inspections: add franchisor read-only
DROP POLICY IF EXISTS "Gov inspections select member or franchisor" ON public.inspections;
CREATE POLICY "Gov inspections select member or franchisor"
  ON public.inspections FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id, auth.uid())
    OR (public.is_franchisor_of(org_id) AND public.has_org_permission(public.get_franchisor_org_for_franchisee(org_id), 'franchise.network.view'))
  );

-- Issues: add franchisor read-only
DROP POLICY IF EXISTS "Gov issues select member or franchisor" ON public.issues;
CREATE POLICY "Gov issues select member or franchisor"
  ON public.issues FOR SELECT TO authenticated
  USING (
    public.is_org_member(org_id, auth.uid())
    OR (public.is_franchisor_of(org_id) AND public.has_org_permission(public.get_franchisor_org_for_franchisee(org_id), 'franchise.network.view'))
  );
