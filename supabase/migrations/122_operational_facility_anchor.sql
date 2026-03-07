-- Phase 1: Operational data model stabilization.
-- Canonical: account = commercial customer, facility = operational service location, launch_packet = sales-to-ops handoff.
-- Add facility_id to opportunities and launch_plans for stable ops/launch handoff; prefer over location_id in new code.

-- 1) opportunities.facility_id — stable facility anchor for launch and ops handoff
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE public.opportunities
      ADD COLUMN facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_opportunities_facility_id
      ON public.opportunities(facility_id) WHERE facility_id IS NOT NULL;
    COMMENT ON COLUMN public.opportunities.facility_id IS 'Canonical operational service location for launch/ops handoff. Prefer over location_id in new code.';
  END IF;
END $$;

-- 2) launch_plans.facility_id — align with opportunity facility for crew/schedule/inspection checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'launch_plans' AND column_name = 'facility_id'
  ) THEN
    ALTER TABLE public.launch_plans
      ADD COLUMN facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_launch_plans_facility_id
      ON public.launch_plans(facility_id) WHERE facility_id IS NOT NULL;
    COMMENT ON COLUMN public.launch_plans.facility_id IS 'Operational site for this launch; prefer over location_id. Set from opportunity.facility_id when creating.';
  END IF;
END $$;

-- location_id on opportunities/launch_plans remains for backward compatibility; do not drop.
-- New code should read/write facility_id and use getOperationalSiteId(facility_id, location_id) for queries.
