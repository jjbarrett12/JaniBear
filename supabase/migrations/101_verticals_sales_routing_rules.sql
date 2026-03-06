-- =============================================================================
-- 101: Vertical-based coverage splits (Sales)
-- verticals, sales_routing_rules, routing_counters; leads.vertical_id + routing_order
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Verticals (industry / facility type)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, key)
);

CREATE INDEX IF NOT EXISTS idx_verticals_org ON public.verticals(org_id);
ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verticals org members read"
  ON public.verticals FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Verticals coverage or lead admin write"
  ON public.verticals FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 2) Sales routing rules (vertical + optional geo + keywords)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  territory_id UUID NULL REFERENCES public.territories(id) ON DELETE SET NULL,
  coverage_area_id UUID NULL REFERENCES public.coverage_areas(id) ON DELETE SET NULL,
  vertical_id UUID NULL REFERENCES public.verticals(id) ON DELETE SET NULL,
  min_employee_count INT NULL,
  max_employee_count INT NULL,
  company_keyword_includes TEXT[] NOT NULL DEFAULT '{}'::text[],
  website_keyword_includes TEXT[] NOT NULL DEFAULT '{}'::text[],
  city_includes TEXT[] NOT NULL DEFAULT '{}'::text[],
  state_includes TEXT[] NOT NULL DEFAULT '{}'::text[],
  assignee_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_team_id UUID NULL,
  assignment_method TEXT NOT NULL DEFAULT 'primary' CHECK (assignment_method IN ('primary', 'round_robin', 'weighted', 'manual')),
  weight INT NOT NULL DEFAULT 1,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_routing_rules_org_active_priority ON public.sales_routing_rules(org_id, active, priority);
ALTER TABLE public.sales_routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales routing rules org members read"
  ON public.sales_routing_rules FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Sales routing rules coverage or lead admin write"
  ON public.sales_routing_rules FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'coverage.write') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 3) Routing counters (round-robin)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routing_counters (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('coverage_area', 'rule')),
  scope_id UUID NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, scope, scope_id)
);

ALTER TABLE public.routing_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routing counters org members read"
  ON public.routing_counters FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Routing counters org members update"
  ON public.routing_counters FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- Atomic increment for round-robin
CREATE OR REPLACE FUNCTION public.increment_routing_counter(
  p_org_id UUID,
  p_scope TEXT,
  p_scope_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counter INT;
BEGIN
  INSERT INTO public.routing_counters (org_id, scope, scope_id, counter, updated_at)
  VALUES (p_org_id, p_scope, p_scope_id, 1, now())
  ON CONFLICT (org_id, scope, scope_id)
  DO UPDATE SET counter = public.routing_counters.counter + 1, updated_at = now()
  RETURNING counter INTO v_counter;
  RETURN v_counter;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4) Leads: vertical classification
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vertical_id UUID NULL REFERENCES public.verticals(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vertical_confidence INT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS vertical_source TEXT NULL CHECK (vertical_source IN ('zoominfo', 'google_places', 'ai', 'manual'));
CREATE INDEX IF NOT EXISTS idx_leads_vertical ON public.leads(org_id, vertical_id) WHERE vertical_id IS NOT NULL;
