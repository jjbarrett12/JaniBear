-- =============================================================================
-- 100: Coverage areas, assignments, territory parameters (Sales + Ops splits)
-- Supports: 1 territory -> many coverage_areas (splits); 1 coverage_area -> many assignees.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Territories (parent geography; optional link from quadrants later)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('sales', 'ops')),
  geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_territories_org_mode ON public.territories(org_id, mode);
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Territories org members read"
  ON public.territories FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Territories coverage.admin write"
  ON public.territories FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 2) Coverage areas (splits of a territory; many per territory)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'polygon' CHECK (type IN ('polygon', 'radius')),
  geojson JSONB NOT NULL,
  parent_territory_id UUID NULL REFERENCES public.territories(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coverage_areas_org ON public.coverage_areas(org_id);
CREATE INDEX IF NOT EXISTS idx_coverage_areas_parent ON public.coverage_areas(org_id, parent_territory_id);
ALTER TABLE public.coverage_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coverage areas org members read"
  ON public.coverage_areas FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Coverage areas coverage.admin write"
  ON public.coverage_areas FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 3) Coverage assignments (many assignees per coverage area)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coverage_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  coverage_area_id UUID NOT NULL REFERENCES public.coverage_areas(id) ON DELETE CASCADE,
  assignee_role TEXT NOT NULL CHECK (assignee_role IN ('sales_rep', 'ops_manager')),
  assignee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight INT NOT NULL DEFAULT 1,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, coverage_area_id, assignee_role, assignee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_coverage_assignments_org_assignee ON public.coverage_assignments(org_id, assignee_user_id, assignee_role);
CREATE INDEX IF NOT EXISTS idx_coverage_assignments_area ON public.coverage_assignments(coverage_area_id);
ALTER TABLE public.coverage_assignments ENABLE ROW LEVEL SECURITY;

-- Admins: full access. Others: SELECT only own assignments (and related coverage_areas via join).
CREATE POLICY "Coverage assignments admin full"
  ON public.coverage_assignments FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())));

CREATE POLICY "Coverage assignments read own"
  ON public.coverage_assignments FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) AND assignee_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 4) Territory parameters (routing + visibility per territory per mode)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.territory_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('sales', 'ops')),
  default_view JSONB NOT NULL DEFAULT '{}'::jsonb,
  routing JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, territory_id, mode)
);

CREATE INDEX IF NOT EXISTS idx_territory_parameters_org_territory ON public.territory_parameters(org_id, territory_id);
ALTER TABLE public.territory_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Territory parameters org members read"
  ON public.territory_parameters FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Territory parameters coverage.admin write"
  ON public.territory_parameters FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 5) Leads: territory_id, coverage_area_id, assigned_user_id
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS territory_id UUID NULL REFERENCES public.territories(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS coverage_area_id UUID NULL REFERENCES public.coverage_areas(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_territory ON public.leads(org_id, territory_id) WHERE territory_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_coverage_area ON public.leads(org_id, coverage_area_id) WHERE coverage_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON public.leads(org_id, assigned_user_id) WHERE assigned_user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6) Facilities: territory_id, coverage_area_id, ops_owner_user_id
-- -----------------------------------------------------------------------------
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS territory_id UUID NULL REFERENCES public.territories(id) ON DELETE SET NULL;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS coverage_area_id UUID NULL REFERENCES public.coverage_areas(id) ON DELETE SET NULL;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS ops_owner_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_territory ON public.facilities(org_id, territory_id) WHERE territory_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_coverage_area ON public.facilities(org_id, coverage_area_id) WHERE coverage_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_ops_owner ON public.facilities(org_id, ops_owner_user_id) WHERE ops_owner_user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 7) Lead events (for routing audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_org_action ON public.lead_events(org_id, action);
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead events org members read"
  ON public.lead_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Lead events insert"
  ON public.lead_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 8) Permission keys: coverage.read, coverage.write, coverage.admin
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('owner', 'coverage.read'),
  ('owner', 'coverage.write'),
  ('owner', 'coverage.admin'),
  ('admin', 'coverage.read'),
  ('admin', 'coverage.write'),
  ('admin', 'coverage.admin'),
  ('org.owner', 'coverage.read'),
  ('org.owner', 'coverage.write'),
  ('org.owner', 'coverage.admin'),
  ('org.admin', 'coverage.read'),
  ('org.admin', 'coverage.write'),
  ('org.admin', 'coverage.admin'),
  ('super_kodiak', 'coverage.read'),
  ('super_kodiak', 'coverage.write'),
  ('super_kodiak', 'coverage.admin'),
  ('kodiak', 'coverage.read'),
  ('kodiak', 'coverage.write'),
  ('kodiak', 'coverage.admin'),
  ('manager', 'coverage.read'),
  ('super_grizzly', 'coverage.read'),
  ('grizzly', 'coverage.read')
ON CONFLICT (role, permission_key) DO NOTHING;
