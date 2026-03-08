-- =============================================================================
-- 125: Activation recommendations — AI + operational scoring for crew assignment
-- Supports new account activations, crew changes, recovery, expansion, restart.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Account requirements (normalized inputs for scoring; optional backfill)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'launch_packet' CHECK (source_type IN ('launch_packet', 'facility', 'manual')),
  source_id UUID,
  square_footage NUMERIC,
  building_type TEXT,
  room_restroom_count INT,
  kitchen_breakroom_count INT,
  service_frequency TEXT,
  service_days JSONB DEFAULT '[]'::jsonb,
  service_window TEXT,
  estimated_labor_hours_per_visit NUMERIC,
  complexity_score NUMERIC,
  special_requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_requirements_org ON public.account_requirements(org_id);
CREATE INDEX IF NOT EXISTS idx_account_requirements_account ON public.account_requirements(account_id);
ALTER TABLE public.account_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account requirements org read"
  ON public.account_requirements FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account requirements org write"
  ON public.account_requirements FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.account_requirements IS 'Normalized account/facility requirements for assignment scoring; from launch packet, facility, or manual.';

-- -----------------------------------------------------------------------------
-- 2) Activation recommendations (primary/secondary/backup crew, reasoning, confidence)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activation_type TEXT NOT NULL CHECK (activation_type IN ('new_account', 'crew_change', 'recovery', 'expansion', 'restart')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('launch_packet', 'crew_change_request', 'account', 'facility')),
  entity_id UUID NOT NULL,
  primary_crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  primary_supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  secondary_crew_ids UUID[] DEFAULT '{}',
  backup_crew_ids UUID[] DEFAULT '{}',
  recommended_headcount INT,
  weekly_labor_hours NUMERIC,
  evening_day_split TEXT,
  reasoning_summary TEXT,
  confidence_score INT CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100)),
  risk_level TEXT CHECK (risk_level IS NULL OR risk_level IN ('low', 'medium', 'high')),
  risk_flags JSONB DEFAULT '[]'::jsonb,
  scores_jsonb JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, activation_type, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_activation_recommendations_org ON public.activation_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_activation_recommendations_entity ON public.activation_recommendations(entity_type, entity_id);
ALTER TABLE public.activation_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activation recommendations org read"
  ON public.activation_recommendations FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Activation recommendations org write"
  ON public.activation_recommendations FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.activation_recommendations IS 'AI + scoring recommendation per activation: primary/secondary/backup crew, supervisor, headcount, labor, reasoning, confidence, risk.';
