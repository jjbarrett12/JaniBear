-- =============================================================================
-- 106: Crew Reliability Snapshots — for Command Center reliability panel
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.crew_reliability_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  reliability_score INT NOT NULL DEFAULT 0,
  attendance_score INT NOT NULL DEFAULT 100,
  no_show_rate NUMERIC NOT NULL DEFAULT 0,
  late_rate NUMERIC NOT NULL DEFAULT 0,
  shift_completion_rate NUMERIC NOT NULL DEFAULT 100,
  qc_consistency_score INT NOT NULL DEFAULT 100,
  trend TEXT NOT NULL DEFAULT 'flat' CHECK (trend IN ('improving', 'flat', 'declining')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, operator_type, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_reliability_org_score ON public.crew_reliability_snapshots(org_id, reliability_score);
ALTER TABLE public.crew_reliability_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crew reliability org read"
  ON public.crew_reliability_snapshots FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Crew reliability org write"
  ON public.crew_reliability_snapshots FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));
