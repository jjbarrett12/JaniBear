-- =============================================================================
-- 104: Account at Risk engine — snapshots, events, interventions, settings
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Account risk snapshots (current state per account)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_risk_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  risk_score INT NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_backups JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'mitigated', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_account_risk_snapshots_org_level ON public.account_risk_snapshots(org_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_account_risk_snapshots_org_score ON public.account_risk_snapshots(org_id, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_account_risk_snapshots_account ON public.account_risk_snapshots(account_id);
ALTER TABLE public.account_risk_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account risk snapshots org read"
  ON public.account_risk_snapshots FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account risk snapshots org write"
  ON public.account_risk_snapshots FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 2) Risk events (audit trail)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  actor_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('risk_detected', 'acknowledged', 'dismissed', 'mitigated', 'backup_assigned', 'intervention_created')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_risk_events_org_account ON public.account_risk_events(org_id, account_id, created_at DESC);
ALTER TABLE public.account_risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account risk events org read"
  ON public.account_risk_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account risk events org insert"
  ON public.account_risk_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 3) Intervention plans
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  risk_snapshot_id UUID NULL REFERENCES public.account_risk_snapshots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_interventions_account ON public.account_interventions(account_id);
ALTER TABLE public.account_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account interventions org read"
  ON public.account_interventions FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Account interventions org write"
  ON public.account_interventions FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) Risk settings per org
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.risk_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  alert_threshold TEXT NOT NULL DEFAULT 'high' CHECK (alert_threshold IN ('medium', 'high', 'critical')),
  min_backup_score INT NOT NULL DEFAULT 70 CHECK (min_backup_score >= 0 AND min_backup_score <= 100),
  require_same_territory BOOLEAN NOT NULL DEFAULT true,
  risk_jump_alert INT NOT NULL DEFAULT 15 CHECK (risk_jump_alert >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Risk settings org read"
  ON public.risk_settings FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Risk settings org write"
  ON public.risk_settings FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 5) Extend alerts type to include account_at_risk
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE t.relname = 'alerts' AND c.contype = 'c' AND a.attname = 'type' AND NOT a.attisdropped
  LOOP
    EXECUTE format('ALTER TABLE public.alerts DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
  ALTER TABLE public.alerts ADD CONSTRAINT alerts_type_check CHECK (
    type IN ('account_health_decay', 'missed_inspection', 'ar_aging', 'margin_leakage', 'account_at_risk')
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
