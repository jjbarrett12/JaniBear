-- ============================================
-- Audit log: immutable trail of key actions (CRM/Ops/Finance).
-- RLS: org isolation + admin-only read. No update/delete for normal users.
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT
);

COMMENT ON TABLE public.audit_log IS 'Immutable audit trail. Key actions: pricing changes, proposal edits, contract frequency, inspection score, invoice edits.';
COMMENT ON COLUMN public.audit_log.before_state IS 'Snapshot before change (relevant fields only).';
COMMENT ON COLUMN public.audit_log.after_state IS 'Snapshot after change (relevant fields only).';

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity ON public.audit_log(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(org_id, actor_user_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only org members with admin role (owner, admin, manager) can read audit log.
CREATE POLICY "Admin can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = audit_log.org_id AND m.user_id = auth.uid()
        AND LOWER(COALESCE(m.role, '')) IN ('owner', 'admin', 'manager')
    )
  );

-- Any org member can insert (so server actions can write when user performs an action).
CREATE POLICY "Org member can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- No UPDATE or DELETE policies: table is append-only for normal users.
-- Super-admin can use service role to delete if required (no policy = only service role).
