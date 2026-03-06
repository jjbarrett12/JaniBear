-- =============================================================================
-- 110: Onboarding analytics events for TTFV and funnel measurement
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_org_created ON public.onboarding_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON public.onboarding_events(org_id, event_type);

COMMENT ON TABLE public.onboarding_events IS 'Onboarding funnel events: signup_time, import_started, file_uploaded, etc. For TTFV and conversion.';

ALTER TABLE public.onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Onboarding events org members"
  ON public.onboarding_events FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = onboarding_events.org_id AND m.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = onboarding_events.org_id AND m.user_id = auth.uid())
  );
