-- =============================================================================
-- 115: Operations core scalable model
-- Separates commercial (account) from execution (agreements, lines, assignments, events).
-- Additive only; no hard-delete of production-critical records; effective-dated assignments.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Service agreements (sold package per location: start, status, pricing, frequency)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'ended', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  contract_ref TEXT,
  contract_value_monthly NUMERIC,
  service_frequency TEXT,
  service_days TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_agreements_org ON public.service_agreements(org_id);
CREATE INDEX IF NOT EXISTS idx_service_agreements_account ON public.service_agreements(account_id);
CREATE INDEX IF NOT EXISTS idx_service_agreements_facility ON public.service_agreements(facility_id);
CREATE INDEX IF NOT EXISTS idx_service_agreements_status ON public.service_agreements(org_id, status);

COMMENT ON TABLE public.service_agreements IS 'Sold service package per location: start/end, status, pricing, frequency. Commercial link to execution.';

-- -----------------------------------------------------------------------------
-- 2. Service lines (distinct services under an agreement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_line_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO public.service_line_types (code, name) VALUES
  ('nightly_janitorial', 'Nightly Janitorial'),
  ('floor_care', 'Floor Care'),
  ('porter', 'Porter'),
  ('windows', 'Windows'),
  ('trash', 'Trash'),
  ('restroom_reset', 'Restroom Reset')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.service_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_agreement_id UUID NOT NULL REFERENCES public.service_agreements(id) ON DELETE CASCADE,
  line_type TEXT NOT NULL REFERENCES public.service_line_types(code),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_lines_org ON public.service_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_service_lines_agreement ON public.service_lines(service_agreement_id);

COMMENT ON TABLE public.service_lines IS 'Distinct operational services under an agreement (e.g. nightly janitorial, floor care, porter).';

-- -----------------------------------------------------------------------------
-- 3. Service assignments (crew/supervisor by facility and optional service line; effective-dated; history via effective_to)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL,
  crew_id UUID NOT NULL REFERENCES public.crews(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_service_assignments_org ON public.service_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_facility ON public.service_assignments(facility_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_service_line ON public.service_assignments(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_crew ON public.service_assignments(crew_id);
CREATE INDEX IF NOT EXISTS idx_service_assignments_effective ON public.service_assignments(facility_id, effective_from, effective_to);

COMMENT ON TABLE public.service_assignments IS 'Crew/supervisor assignment by facility and optional service line. effective_to set on reassignment; no hard delete.';

-- -----------------------------------------------------------------------------
-- 4. Assignment history (audit when assignments are ended or replaced)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_assignment_id UUID NOT NULL REFERENCES public.service_assignments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'ended', 'replaced')),
  effective_to_set DATE,
  replaced_by_assignment_id UUID REFERENCES public.service_assignments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_service_assignment_history_assignment ON public.service_assignment_history(service_assignment_id);

COMMENT ON TABLE public.service_assignment_history IS 'Audit log when assignments are ended or replaced (crew change workflow).';

-- -----------------------------------------------------------------------------
-- 5. Inspection programs (template + cadence per location, optional service line)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inspection_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cadence TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspection_programs_org ON public.inspection_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_inspection_programs_facility ON public.inspection_programs(facility_id);
CREATE INDEX IF NOT EXISTS idx_inspection_programs_template ON public.inspection_programs(template_id);

COMMENT ON TABLE public.inspection_programs IS 'Inspection program: location + optional service line, template, cadence.';

-- -----------------------------------------------------------------------------
-- 6. Service events (completed / missed / partial per line, location, date, crew)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  service_assignment_id UUID REFERENCES public.service_assignments(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'missed', 'partial', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_events_org ON public.service_events(org_id);
CREATE INDEX IF NOT EXISTS idx_service_events_facility_date ON public.service_events(facility_id, service_date);
CREATE INDEX IF NOT EXISTS idx_service_events_service_line ON public.service_events(service_line_id);
CREATE INDEX IF NOT EXISTS idx_service_events_crew ON public.service_events(crew_id);
CREATE INDEX IF NOT EXISTS idx_service_events_status ON public.service_events(org_id, status);

COMMENT ON TABLE public.service_events IS 'Actual service execution record per facility, line, date, crew (completed/missed/partial).';

-- -----------------------------------------------------------------------------
-- 7. Extend issues: service line, service event, assignment context
-- -----------------------------------------------------------------------------
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS service_event_id UUID REFERENCES public.service_events(id) ON DELETE SET NULL;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS service_assignment_id UUID REFERENCES public.service_assignments(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_issues_service_line ON public.issues(service_line_id) WHERE service_line_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_issues_service_event ON public.issues(service_event_id) WHERE service_event_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 8. Extend inspections: inspection program, service line
-- -----------------------------------------------------------------------------
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspection_program_id UUID REFERENCES public.inspection_programs(id) ON DELETE SET NULL;
ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_inspection_program ON public.inspections(inspection_program_id) WHERE inspection_program_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 9. Crew change workflow
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crew_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  service_line_id UUID REFERENCES public.service_lines(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'replaced')),
  current_assignment_id UUID REFERENCES public.service_assignments(id) ON DELETE SET NULL,
  replacement_crew_id UUID REFERENCES public.crews(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  new_assignment_id UUID REFERENCES public.service_assignments(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crew_change_requests_org ON public.crew_change_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_crew_change_requests_facility ON public.crew_change_requests(facility_id);
CREATE INDEX IF NOT EXISTS idx_crew_change_requests_status ON public.crew_change_requests(org_id, status);

COMMENT ON TABLE public.crew_change_requests IS 'Crew change workflow: request → approval/rejection → new assignment; continuity tracking.';

-- -----------------------------------------------------------------------------
-- 10. Launch packet → ops activation (optional link to created agreement)
-- -----------------------------------------------------------------------------
ALTER TABLE public.launch_packets ADD COLUMN IF NOT EXISTS service_agreement_id UUID REFERENCES public.service_agreements(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_launch_packets_service_agreement ON public.launch_packets(service_agreement_id) WHERE service_agreement_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- RLS: org-scoped for all new tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_service_agreements_org" ON public.service_agreements FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_service_lines_org" ON public.service_lines FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_service_assignments_org" ON public.service_assignments FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_service_assignment_history_org" ON public.service_assignment_history FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_inspection_programs_org" ON public.inspection_programs FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_service_events_org" ON public.service_events FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

CREATE POLICY "ops_crew_change_requests_org" ON public.crew_change_requests FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

-- Franchisor read-only (optional): use has_org_permission + is_franchisor_of where needed
-- Already covered by is_org_member for same-org; franchisor policies can be added per-table if required.
