-- =============================================================================
-- 127: Account Intelligence Profile — central AI profile per lead/account
-- Evolves from lead through walkthrough, proposal, close, activation, service.
-- Hunt → Stalk → Kill → Launch to Ops. Multi-tenant safe; no rename of existing tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) account_intelligence_profiles — central profile (hybrid: structured + JSON)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_intelligence_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  CONSTRAINT at_least_lead_or_account CHECK (lead_id IS NOT NULL OR account_id IS NOT NULL),

  building_type TEXT,
  square_footage_estimate NUMERIC,
  restroom_count INT,
  floor_count INT,
  cleaning_scope_summary TEXT,
  service_frequency TEXT,
  service_days JSONB DEFAULT '[]'::jsonb,
  service_window TEXT CHECK (service_window IS NULL OR service_window IN ('evening', 'day', 'mixed')),
  estimated_labor_hours_per_visit NUMERIC,
  recommended_headcount INT,
  recommended_cluster_id UUID REFERENCES public.route_clusters(id) ON DELETE SET NULL,
  proposal_readiness TEXT,
  activation_readiness TEXT,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  missing_data_flags JSONB DEFAULT '[]'::jsonb,

  verification_state TEXT NOT NULL DEFAULT 'ai_estimated'
    CHECK (verification_state IN ('ai_estimated', 'human_confirmed', 'contract_confirmed', 'inferred', 'stale')),

  raw_ai_output JSONB DEFAULT '{}'::jsonb,
  evidence_summary JSONB DEFAULT '{}'::jsonb,
  confidence_metadata JSONB DEFAULT '{}'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,

  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_intelligence_profiles_lead
  ON public.account_intelligence_profiles(org_id, lead_id) WHERE lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_intelligence_profiles_account
  ON public.account_intelligence_profiles(org_id, account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_account_intelligence_profiles_org ON public.account_intelligence_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_account_intelligence_profiles_opportunity ON public.account_intelligence_profiles(opportunity_id) WHERE opportunity_id IS NOT NULL;

ALTER TABLE public.account_intelligence_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_intelligence_profiles_org_read"
  ON public.account_intelligence_profiles FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "account_intelligence_profiles_org_write"
  ON public.account_intelligence_profiles FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.account_intelligence_profiles IS 'Central AI intelligence profile per lead/account; evolves from Hunt through Launch to Ops.';

-- -----------------------------------------------------------------------------
-- 2) profile_sources — evidence / provenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.account_intelligence_profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_entity_type TEXT NOT NULL CHECK (source_entity_type IN ('lead', 'walkthrough', 'proposal', 'account', 'contract', 'bid')),
  source_entity_id UUID NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_sources_profile ON public.profile_sources(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_sources_org ON public.profile_sources(org_id);
CREATE INDEX IF NOT EXISTS idx_profile_sources_entity ON public.profile_sources(source_entity_type, source_entity_id);

ALTER TABLE public.profile_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_sources_org_read"
  ON public.profile_sources FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "profile_sources_org_write"
  ON public.profile_sources FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.profile_sources IS 'Evidence/provenance for profile data: lead, walkthrough, proposal, etc.';

-- -----------------------------------------------------------------------------
-- 3) extracted_spaces — zones, rooms, floors, areas (e.g. from LiDAR/scope)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extracted_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.account_intelligence_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  space_type TEXT NOT NULL CHECK (space_type IN ('zone', 'room', 'floor', 'area')),
  sort_order INT NOT NULL DEFAULT 0,
  geo_json JSONB DEFAULT '{}'::jsonb,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_extracted_spaces_profile ON public.extracted_spaces(profile_id);
CREATE INDEX IF NOT EXISTS idx_extracted_spaces_org ON public.extracted_spaces(org_id);

ALTER TABLE public.extracted_spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extracted_spaces_org_read"
  ON public.extracted_spaces FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "extracted_spaces_org_write"
  ON public.extracted_spaces FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.extracted_spaces IS 'AI-extracted spaces (zone, room, floor, area) for profile.';

-- -----------------------------------------------------------------------------
-- 4) ai_recommendations — recommendations over time
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.account_intelligence_profiles(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  content TEXT,
  content_jsonb JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_profile ON public.ai_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_org ON public.ai_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON public.ai_recommendations(profile_id, status);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_recommendations_org_read"
  ON public.ai_recommendations FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "ai_recommendations_org_write"
  ON public.ai_recommendations FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.ai_recommendations IS 'AI recommendations over time (proposal, staffing, route).';

-- -----------------------------------------------------------------------------
-- 5) ai_readiness_tasks — missing-data / readiness tasks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_readiness_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.account_intelligence_profiles(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('missing_data', 'proposal_readiness', 'activation_readiness')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  due_at TIMESTAMPTZ,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_readiness_tasks_profile ON public.ai_readiness_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_readiness_tasks_org ON public.ai_readiness_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_readiness_tasks_status ON public.ai_readiness_tasks(profile_id, status);

ALTER TABLE public.ai_readiness_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_readiness_tasks_org_read"
  ON public.ai_readiness_tasks FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "ai_readiness_tasks_org_write"
  ON public.ai_readiness_tasks FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.ai_readiness_tasks IS 'AI-generated missing-data or readiness tasks.';
