-- Service Deployments: operational pipeline (new account, crew reassignment, scope change, franchise transfer, service restart).
-- Integrates with accounts, crews, facilities, schedules. Every stage transition is recorded in deployment_events.

-- service_deployments
CREATE TABLE IF NOT EXISTS service_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  deployment_type TEXT NOT NULL CHECK (deployment_type IN (
    'new_account', 'crew_reassignment', 'scope_change', 'franchise_transfer', 'service_restart'
  )),
  reason TEXT,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage TEXT NOT NULL DEFAULT 'request_logged' CHECK (stage IN (
    'request_logged', 'review_approval', 'crew_assignment', 'go_live_prep', 'live_monitoring', 'stabilization_complete'
  )),
  assigned_crew_id UUID REFERENCES crews(id) ON DELETE SET NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
  notes TEXT,
  go_live_checklist JSONB DEFAULT '[]',
  stabilization_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_deployments_org ON service_deployments(org_id);
CREATE INDEX IF NOT EXISTS idx_service_deployments_stage ON service_deployments(org_id, stage);
CREATE INDEX IF NOT EXISTS idx_service_deployments_account ON service_deployments(account_id);
CREATE INDEX IF NOT EXISTS idx_service_deployments_requested_at ON service_deployments(requested_at DESC);

COMMENT ON TABLE service_deployments IS 'Operations pipeline: new account activations, crew reassignments, scope changes, franchise transfers, service restarts.';

-- deployment_events: one row per stage transition
CREATE TABLE IF NOT EXISTS deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES service_deployments(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL CHECK (to_stage IN (
    'request_logged', 'review_approval', 'crew_assignment', 'go_live_prep', 'live_monitoring', 'stabilization_complete'
  )),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_deployment_events_deployment ON deployment_events(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_events_created_at ON deployment_events(created_at DESC);

COMMENT ON TABLE deployment_events IS 'Audit trail for every stage transition on a service deployment.';

-- RLS
ALTER TABLE service_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_select_service_deployments" ON service_deployments;
CREATE POLICY "org_member_select_service_deployments" ON service_deployments
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_service_deployments" ON service_deployments;
CREATE POLICY "org_member_insert_service_deployments" ON service_deployments
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_service_deployments" ON service_deployments;
CREATE POLICY "org_member_update_service_deployments" ON service_deployments
  FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_service_deployments" ON service_deployments;
CREATE POLICY "org_member_delete_service_deployments" ON service_deployments
  FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- deployment_events: readable/insertable by org members (via deployment's org)
DROP POLICY IF EXISTS "org_member_select_deployment_events" ON deployment_events;
CREATE POLICY "org_member_select_deployment_events" ON deployment_events
  FOR SELECT TO authenticated
  USING (
    deployment_id IN (SELECT id FROM service_deployments WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "org_member_insert_deployment_events" ON deployment_events;
CREATE POLICY "org_member_insert_deployment_events" ON deployment_events
  FOR INSERT TO authenticated
  WITH CHECK (
    deployment_id IN (SELECT id FROM service_deployments WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );
