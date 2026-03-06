-- =============================================================================
-- 103: Operator Performance Engine + Smart Account Allocation
-- operator_performance, operator_capacity, account_complaints, account_assignment_events
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Operator performance scores (crew | franchisee)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operator_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  qc_score NUMERIC NOT NULL DEFAULT 100,
  complaint_rate NUMERIC NOT NULL DEFAULT 0,
  missed_tasks_rate NUMERIC NOT NULL DEFAULT 0,
  response_time_score NUMERIC NOT NULL DEFAULT 100,
  leadership_score NUMERIC NOT NULL DEFAULT 100,
  capacity_score NUMERIC NOT NULL DEFAULT 100,
  territory_proximity_score NUMERIC NOT NULL DEFAULT 100,
  total_score NUMERIC NOT NULL DEFAULT 0,
  score_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, operator_type, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_operator_performance_org_type_score ON public.operator_performance(org_id, operator_type, total_score DESC);
ALTER TABLE public.operator_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operator performance org members read"
  ON public.operator_performance FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Operator performance org write"
  ON public.operator_performance FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 2) Operator capacity (active/max accounts, sqft, growth)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operator_capacity (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  active_accounts INT NOT NULL DEFAULT 0,
  max_accounts INT NOT NULL DEFAULT 0,
  max_sqft NUMERIC NULL,
  current_sqft NUMERIC NULL,
  growth_capacity NUMERIC NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, operator_type, operator_id)
);

ALTER TABLE public.operator_capacity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operator capacity org members read"
  ON public.operator_capacity FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Operator capacity org write"
  ON public.operator_capacity FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 3) Account complaints (for complaint rate)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NULL REFERENCES public.accounts(id) ON DELETE SET NULL,
  facility_id UUID NULL REFERENCES public.facilities(id) ON DELETE SET NULL,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  severity INT NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_complaints_org_created ON public.account_complaints(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_complaints_operator ON public.account_complaints(org_id, operator_type, operator_id);
ALTER TABLE public.account_complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account complaints org members read"
  ON public.account_complaints FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account complaints org write"
  ON public.account_complaints FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) Account assignment events (audit log)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_assignment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  operator_type TEXT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NULL,
  assigned_by_system BOOLEAN NOT NULL DEFAULT false,
  assigned_by_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_assignment_events_account ON public.account_assignment_events(account_id);
CREATE INDEX IF NOT EXISTS idx_account_assignment_events_org ON public.account_assignment_events(org_id);
ALTER TABLE public.account_assignment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account assignment events org members read"
  ON public.account_assignment_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account assignment events org write"
  ON public.account_assignment_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 5) Accounts: recommendation and auto-assign metadata
-- -----------------------------------------------------------------------------
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS recommended_operator_type TEXT NULL CHECK (recommended_operator_type IN ('crew', 'franchisee'));
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS recommended_operator_id UUID NULL;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS assigned_by_system BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_accounts_recommended ON public.accounts(org_id, recommended_operator_id) WHERE recommended_operator_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6) Org setting: auto-assign new accounts (optional)
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS auto_assign_accounts BOOLEAN NOT NULL DEFAULT false;
