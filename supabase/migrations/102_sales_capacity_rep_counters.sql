-- =============================================================================
-- 102: Rep capacity limits + fairness (routing guardrails)
-- sales_capacity_settings, rep_capacity_overrides, rep_lead_counters; leads.overflow
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Org-level sales capacity settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_capacity_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  max_new_leads_per_rep INT NOT NULL DEFAULT 80,
  max_working_leads_per_rep INT NOT NULL DEFAULT 200,
  lookback_days INT NOT NULL DEFAULT 365,
  overflow_strategy TEXT NOT NULL DEFAULT 'next_rep' CHECK (overflow_strategy IN ('next_rep', 'overflow_rep', 'unassigned_queue')),
  overflow_rep_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  respect_vertical_ownership BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_capacity_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales capacity settings org members read"
  ON public.sales_capacity_settings FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Sales capacity settings admin write"
  ON public.sales_capacity_settings FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 2) Per-rep capacity overrides (optional)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rep_capacity_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_new_leads INT NULL,
  max_working_leads INT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rep_capacity_overrides_org ON public.rep_capacity_overrides(org_id);
ALTER TABLE public.rep_capacity_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rep capacity overrides org members read"
  ON public.rep_capacity_overrides FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Rep capacity overrides admin write"
  ON public.rep_capacity_overrides FOR ALL TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())))
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'coverage.admin') OR public.has_permission(org_id, 'lead.admin') OR public.is_site_admin(auth.uid())));

-- -----------------------------------------------------------------------------
-- 3) Cached rep lead counters (updated server-side on assign/status change)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rep_lead_counters (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  new_count INT NOT NULL DEFAULT 0,
  working_count INT NOT NULL DEFAULT 0,
  qualified_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

ALTER TABLE public.rep_lead_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rep lead counters org members read"
  ON public.rep_lead_counters FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Rep lead counters org members all"
  ON public.rep_lead_counters FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) Leads: overflow flag and routing metadata
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS overflow BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS overflow_reason TEXT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS routed_by TEXT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_overflow ON public.leads(org_id, overflow) WHERE overflow = true;
