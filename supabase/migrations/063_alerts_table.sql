-- ============================================
-- Alerts engine: unified alerts table for risk radar and alerts center.
-- Types: account_health_decay, missed_inspection, ar_aging, margin_leakage.
-- Supports dismiss, assign, and "what changed" via signals jsonb.
-- ============================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('account_health_decay', 'missed_inspection', 'ar_aging', 'margin_leakage')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'dismissed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,
  signals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.alerts IS 'Unified alerts from account health, missed inspections, AR aging, margin rules. signals = contributing factors for "what changed" view.';
COMMENT ON COLUMN public.alerts.signals IS 'Array of { label, value, detail? } describing what contributed to this alert.';

CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_org_created ON public.alerts(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON public.alerts(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(org_id, type);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read alerts"
  ON public.alerts FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can insert alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can update alerts"
  ON public.alerts FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members can delete alerts"
  ON public.alerts FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_alerts();
