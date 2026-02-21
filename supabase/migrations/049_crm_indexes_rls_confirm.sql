-- CRM spine: composite indexes for list queries + RLS confirmation.
-- Additive only. No table/column renames or deletes.
-- RLS for crm_activities and crm_contacts is already applied in 048; this migration adds indexes only.

-- =============================================================================
-- 1. Locations (canonical facility) — list by org + client (only when table exists)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    CREATE INDEX IF NOT EXISTS idx_locations_org_id_client_id
      ON public.locations(org_id, client_id)
      WHERE client_id IS NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 2. Opportunities — CRM lists by org, client, location, stage
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_opportunities_org_client_location_stage
  ON public.opportunities(org_id, client_id, location_id, stage);

-- =============================================================================
-- 3. Walkthroughs — by org, opportunity, location, status
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_walkthroughs_org_opportunity_location_status
  ON public.walkthroughs(org_id, opportunity_id, location_id, status);

-- =============================================================================
-- 4. Bids — by org, opportunity, walkthrough, status
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_bids_org_opportunity_walkthrough_status
  ON public.bids(org_id, opportunity_id, walkthrough_id, status);

-- =============================================================================
-- 5. CRM Activities — timeline by org + opportunity + due_at
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_crm_activities_org_opportunity_due_at
  ON public.crm_activities(org_id, opportunity_id, due_at)
  WHERE opportunity_id IS NOT NULL AND due_at IS NOT NULL;

-- =============================================================================
-- 6. CRM Contacts — by org, client, location
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_client_location
  ON public.crm_contacts(org_id, client_id, location_id);

-- =============================================================================
-- RLS: crm_activities and crm_contacts already have RLS + org_members policies in 048.
-- No change needed unless 048 was skipped; then uncomment below.
-- =============================================================================
-- ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
-- (Policies created in 048.)
