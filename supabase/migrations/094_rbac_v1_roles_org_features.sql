-- =============================================================================
-- 094: RBAC v1 canonical roles + org_features for add-on gating
-- - org_features (org_id, feature_key, enabled)
-- - role_permissions seeds for org.owner, org.admin, sales.*, ops.*, client.viewer
-- - Trigger: allow org.owner and owner to assign owner/org.owner
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) org_features: per-org add-on flags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_features (
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, feature_key)
);
CREATE INDEX IF NOT EXISTS idx_org_features_org_id ON public.org_features(org_id);
COMMENT ON TABLE public.org_features IS 'Per-org add-on feature flags (addon.lidar, addon.ai_proposals, addon.helphubqr).';

ALTER TABLE public.org_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can read org_features"
  ON public.org_features FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()));
CREATE POLICY "Org owner/admin can manage org_features"
  ON public.org_features FOR ALL TO authenticated
  USING (public.has_org_role(org_id, ARRAY['owner', 'admin', 'org.owner', 'org.admin']))
  WITH CHECK (public.has_org_role(org_id, ARRAY['owner', 'admin', 'org.owner', 'org.admin']));

-- -----------------------------------------------------------------------------
-- 2) role_permissions: seed v1 roles and permission keys
-- -----------------------------------------------------------------------------
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('org.owner', 'org.read'),
  ('org.owner', 'org.update'),
  ('org.owner', 'org.members.invite'),
  ('org.owner', 'org.members.remove'),
  ('org.owner', 'org.members.role.assign'),
  ('org.owner', 'org.switch'),
  ('org.owner', 'billing.read'),
  ('org.owner', 'billing.update'),
  ('org.owner', 'billing.cancel'),
  ('org.owner', 'walkthrough.create'),
  ('org.owner', 'walkthrough.read'),
  ('org.owner', 'walkthrough.update'),
  ('org.owner', 'walkthrough.delete'),
  ('org.owner', 'proposal.generate'),
  ('org.owner', 'proposal.read'),
  ('org.owner', 'proposal.send'),
  ('org.owner', 'contract.create'),
  ('org.owner', 'contract.read'),
  ('org.owner', 'inspection.create'),
  ('org.owner', 'inspection.read'),
  ('org.owner', 'inspection.update'),
  ('org.owner', 'inspection.complete'),
  ('org.owner', 'inspection.score.read'),
  ('org.owner', 'task.read.assigned'),
  ('org.owner', 'task.read.all'),
  ('org.owner', 'task.assign'),
  ('org.owner', 'task.complete'),
  ('org.owner', 'task.proof.upload'),
  ('org.owner', 'issue.create'),
  ('org.owner', 'issue.read'),
  ('org.owner', 'issue.assign'),
  ('org.owner', 'issue.close'),
  ('org.owner', 'dashboard.sales'),
  ('org.owner', 'dashboard.ops'),
  ('org.owner', 'dashboard.exec'),
  ('org.owner', 'settings.branding'),
  ('org.owner', 'settings.integrations'),
  ('org.owner', 'settings.ai'),
  ('org.owner', 'org.manage_users'),
  ('org.admin', 'org.read'),
  ('org.admin', 'org.update'),
  ('org.admin', 'org.members.invite'),
  ('org.admin', 'org.members.remove'),
  ('org.admin', 'org.members.role.assign'),
  ('org.admin', 'org.switch'),
  ('org.admin', 'billing.read'),
  ('org.admin', 'billing.update'),
  ('org.admin', 'billing.cancel'),
  ('org.admin', 'walkthrough.create'),
  ('org.admin', 'walkthrough.read'),
  ('org.admin', 'walkthrough.update'),
  ('org.admin', 'walkthrough.delete'),
  ('org.admin', 'proposal.generate'),
  ('org.admin', 'proposal.read'),
  ('org.admin', 'proposal.send'),
  ('org.admin', 'contract.create'),
  ('org.admin', 'contract.read'),
  ('org.admin', 'inspection.create'),
  ('org.admin', 'inspection.read'),
  ('org.admin', 'inspection.update'),
  ('org.admin', 'inspection.complete'),
  ('org.admin', 'inspection.score.read'),
  ('org.admin', 'task.read.assigned'),
  ('org.admin', 'task.read.all'),
  ('org.admin', 'task.assign'),
  ('org.admin', 'task.complete'),
  ('org.admin', 'task.proof.upload'),
  ('org.admin', 'issue.create'),
  ('org.admin', 'issue.read'),
  ('org.admin', 'issue.assign'),
  ('org.admin', 'issue.close'),
  ('org.admin', 'dashboard.sales'),
  ('org.admin', 'dashboard.ops'),
  ('org.admin', 'dashboard.exec'),
  ('org.admin', 'settings.branding'),
  ('org.admin', 'settings.integrations'),
  ('org.admin', 'settings.ai'),
  ('org.admin', 'org.manage_users'),
  ('sales.manager', 'org.read'),
  ('sales.manager', 'walkthrough.create'),
  ('sales.manager', 'walkthrough.read'),
  ('sales.manager', 'walkthrough.update'),
  ('sales.manager', 'walkthrough.delete'),
  ('sales.manager', 'proposal.generate'),
  ('sales.manager', 'proposal.read'),
  ('sales.manager', 'proposal.send'),
  ('sales.manager', 'contract.create'),
  ('sales.manager', 'contract.read'),
  ('sales.manager', 'dashboard.sales'),
  ('sales.rep', 'org.read'),
  ('sales.rep', 'walkthrough.create'),
  ('sales.rep', 'walkthrough.read'),
  ('sales.rep', 'walkthrough.update'),
  ('sales.rep', 'proposal.generate'),
  ('sales.rep', 'proposal.read'),
  ('sales.rep', 'proposal.send'),
  ('sales.rep', 'contract.read'),
  ('sales.rep', 'dashboard.sales'),
  ('ops.manager', 'org.read'),
  ('ops.manager', 'inspection.create'),
  ('ops.manager', 'inspection.read'),
  ('ops.manager', 'inspection.update'),
  ('ops.manager', 'inspection.complete'),
  ('ops.manager', 'inspection.score.read'),
  ('ops.manager', 'task.read.all'),
  ('ops.manager', 'task.assign'),
  ('ops.manager', 'issue.create'),
  ('ops.manager', 'issue.read'),
  ('ops.manager', 'issue.assign'),
  ('ops.manager', 'issue.close'),
  ('ops.manager', 'dashboard.ops'),
  ('ops.manager', 'dashboard.exec'),
  ('ops.crew_lead', 'org.read'),
  ('ops.crew_lead', 'task.read.all'),
  ('ops.crew_lead', 'task.assign'),
  ('ops.crew_lead', 'task.complete'),
  ('ops.crew_lead', 'task.proof.upload'),
  ('ops.crew_lead', 'issue.create'),
  ('ops.crew_lead', 'issue.read'),
  ('ops.crew_lead', 'issue.assign'),
  ('ops.crew_lead', 'issue.close'),
  ('ops.crew_lead', 'inspection.read'),
  ('ops.crew_lead', 'inspection.complete'),
  ('ops.crew_lead', 'dashboard.ops'),
  ('ops.crew', 'org.read'),
  ('ops.crew', 'task.read.assigned'),
  ('ops.crew', 'task.complete'),
  ('ops.crew', 'task.proof.upload'),
  ('ops.crew', 'issue.create'),
  ('ops.crew', 'issue.read'),
  ('client.viewer', 'org.read'),
  ('client.viewer', 'proposal.read'),
  ('client.viewer', 'inspection.score.read'),
  ('owner', 'dashboard.sales'),
  ('owner', 'dashboard.ops'),
  ('owner', 'settings.branding'),
  ('admin', 'dashboard.sales'),
  ('admin', 'dashboard.ops'),
  ('admin', 'settings.branding')
ON CONFLICT (role, permission_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 3) Trigger: only owner or org.owner can assign owner / org.owner
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_owner_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('owner', 'org.owner') THEN
    IF NOT public.has_org_role(NEW.org_id, ARRAY['owner', 'org.owner']) THEN
      RAISE EXCEPTION 'Only an owner can assign the owner role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_invite_owner_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('owner', 'org.owner') THEN
    IF NOT public.has_org_role(NEW.org_id, ARRAY['owner', 'org.owner']) THEN
      RAISE EXCEPTION 'Only an owner can invite as owner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
