-- =============================================================================
-- 126: Route-aware assignment engine — clusters, crew route profiles, capacity
-- snapshots, staffing plans, decision logs; extend activation_recommendations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) route_clusters — logical route groupings (e.g. North zone, Downtown)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.route_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  territory_id UUID NULL,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_route_clusters_org ON public.route_clusters(org_id);
ALTER TABLE public.route_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "route_clusters_org_read"
  ON public.route_clusters FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "route_clusters_org_write"
  ON public.route_clusters FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.route_clusters IS 'Logical route groupings for assignment; which cluster should absorb a new account.';

-- -----------------------------------------------------------------------------
-- 2) crew_route_profiles — snapshot of crew current route (facilities, centroid, drive, window)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crew_route_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  facility_ids UUID[] DEFAULT '{}',
  facility_count INT NOT NULL DEFAULT 0,
  centroid_lat DOUBLE PRECISION,
  centroid_lng DOUBLE PRECISION,
  avg_drive_minutes_per_visit NUMERIC,
  service_window TEXT CHECK (service_window IS NULL OR service_window IN ('evening', 'day', 'mixed')),
  cluster_id UUID REFERENCES public.route_clusters(id) ON DELETE SET NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, crew_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_route_profiles_org ON public.crew_route_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_crew_route_profiles_crew ON public.crew_route_profiles(crew_id);
ALTER TABLE public.crew_route_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_route_profiles_org_read"
  ON public.crew_route_profiles FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "crew_route_profiles_org_write"
  ON public.crew_route_profiles FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.crew_route_profiles IS 'Crew current route snapshot: assigned facilities, centroid, drive metrics, service window.';

-- -----------------------------------------------------------------------------
-- 3) crew_capacity_snapshots — point-in-time capacity for audit
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crew_capacity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  active_accounts INT NOT NULL DEFAULT 0,
  max_accounts INT NOT NULL DEFAULT 0,
  current_sqft NUMERIC,
  max_sqft NUMERIC,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, crew_id)
);

CREATE INDEX IF NOT EXISTS idx_crew_capacity_snapshots_org ON public.crew_capacity_snapshots(org_id);
ALTER TABLE public.crew_capacity_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crew_capacity_snapshots_org_read"
  ON public.crew_capacity_snapshots FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "crew_capacity_snapshots_org_write"
  ON public.crew_capacity_snapshots FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.crew_capacity_snapshots IS 'Point-in-time crew capacity for assignment audit.';

-- -----------------------------------------------------------------------------
-- 4) shift_staffing_plans — nightly or day-by-day staffing split
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_staffing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activation_recommendation_id UUID REFERENCES public.activation_recommendations(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'nightly' CHECK (plan_type IN ('nightly', 'day_by_day')),
  schedule_jsonb JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_staffing_plans_org ON public.shift_staffing_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_shift_staffing_plans_entity ON public.shift_staffing_plans(entity_type, entity_id);
ALTER TABLE public.shift_staffing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_staffing_plans_org_read"
  ON public.shift_staffing_plans FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "shift_staffing_plans_org_write"
  ON public.shift_staffing_plans FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.shift_staffing_plans IS 'Nightly or day-by-day staffing split per activation.';

-- -----------------------------------------------------------------------------
-- 5) assignment_decision_logs — audit when recommendation accepted/overridden
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignment_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activation_recommendation_id UUID REFERENCES public.activation_recommendations(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('accepted', 'overridden', 'deferred')),
  chosen_crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  recommended_crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assignment_decision_logs_org ON public.assignment_decision_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_assignment_decision_logs_entity ON public.assignment_decision_logs(entity_type, entity_id);
ALTER TABLE public.assignment_decision_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assignment_decision_logs_org_read"
  ON public.assignment_decision_logs FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "assignment_decision_logs_org_insert"
  ON public.assignment_decision_logs FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

COMMENT ON TABLE public.assignment_decision_logs IS 'Audit log when a recommendation is accepted, overridden, or deferred.';

-- -----------------------------------------------------------------------------
-- 6) Extend activation_recommendations — route fit, cluster, staffing split, score groups
-- -----------------------------------------------------------------------------
ALTER TABLE public.activation_recommendations
  ADD COLUMN IF NOT EXISTS route_fit_score INT CHECK (route_fit_score IS NULL OR (route_fit_score >= 0 AND route_fit_score <= 100)),
  ADD COLUMN IF NOT EXISTS added_travel_minutes NUMERIC,
  ADD COLUMN IF NOT EXISTS recommended_cluster_id UUID REFERENCES public.route_clusters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nightly_staffing_split JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS score_groups_jsonb JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.activation_recommendations.route_fit_score IS 'Route efficiency score 0-100 for primary crew.';
COMMENT ON COLUMN public.activation_recommendations.added_travel_minutes IS 'Estimated added drive time (minutes) per visit or week if this account is assigned.';
COMMENT ON COLUMN public.activation_recommendations.recommended_cluster_id IS 'Route cluster that should absorb this account.';
COMMENT ON COLUMN public.activation_recommendations.nightly_staffing_split IS 'Day-by-day staffing: e.g. { "Mon": { "evening": 2, "day": 0 }, ... }.';
COMMENT ON COLUMN public.activation_recommendations.score_groups_jsonb IS 'Breakdown: capability_fit, capacity_fit, route_fit, risk_fit scores.';

-- -----------------------------------------------------------------------------
-- 7) Allow facility in geo_entities for facility lat/lng
-- -----------------------------------------------------------------------------
ALTER TABLE public.geo_entities DROP CONSTRAINT IF EXISTS geo_entities_entity_type_check;
ALTER TABLE public.geo_entities ADD CONSTRAINT geo_entities_entity_type_check
  CHECK (entity_type IN ('lead', 'account', 'crew', 'franchisee', 'site', 'building', 'prospect', 'facility'));
