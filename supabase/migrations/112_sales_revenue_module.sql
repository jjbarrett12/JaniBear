-- =============================================================================
-- 112: Sales Revenue Module — Leads extension, lead_activities, import batches,
--     enrichment snapshots, opportunity/walkthrough/proposal refinements.
-- Additive only; safe to run on existing DB.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LEADS: Expand source and status enums (drop + recreate CHECK)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
    ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
    ALTER TABLE public.leads ADD CONSTRAINT leads_source_check CHECK (source IN (
      'paste', 'email', 'text', 'third_party', 'voice', 'scan',
      'manual', 'csv_import', 'website_form', 'referral', 'google_business',
      'zoominfo', 'linkedin', 'map_prospecting', 'existing_customer_referral', 'other'
    ));
    ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN (
      'new', 'enriched', 'working', 'attempted_contact', 'contacted', 'qualified',
      'walkthrough_scheduled', 'walkthrough_completed', 'proposal_stage',
      'converted', 'unqualified', 'lost',
      'walkthrough_done', 'proposal_sent', 'won'
    ));
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If constraint names differ (e.g. from 089), leave existing; app layer validates.
  NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. LEADS: New columns for hunting workflow
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_sq_ft NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS estimated_locations INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS employee_count INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS current_cleaning_provider TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS qualification_score INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_follow_up_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS duplicate_of_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON public.leads(org_id, next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON public.leads(org_id, lead_score DESC NULLS LAST) WHERE lead_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(org_id, source);
CREATE INDEX IF NOT EXISTS idx_leads_enrichment ON public.leads(org_id, enrichment_status) WHERE enrichment_status IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. lead_activities — timeline for calls, notes, touches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'sms', 'meeting', 'note', 'touch', 'status_change', 'converted')),
  subject TEXT,
  body TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  meta JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_org ON public.lead_activities(org_id);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can manage lead_activities" ON public.lead_activities;
CREATE POLICY "Org members can manage lead_activities"
  ON public.lead_activities FOR ALL
  USING (public.is_org_member(org_id, auth.uid()));

-- -----------------------------------------------------------------------------
-- 4. lead_import_batches — for CSV import tagging and bulk views
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT,
  source TEXT DEFAULT 'csv_import',
  row_count INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_import_batches_org ON public.lead_import_batches(org_id);

ALTER TABLE public.lead_import_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can manage lead_import_batches" ON public.lead_import_batches;
CREATE POLICY "Org members can manage lead_import_batches"
  ON public.lead_import_batches FOR ALL
  USING (public.is_org_member(org_id, auth.uid()));

-- FK from leads to batch
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES public.lead_import_batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_import_batch ON public.leads(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. lead_enrichment_snapshots — optional cache of enrichment data
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_enrichment_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  provider TEXT,
  raw_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_lead_enrichment_lead ON public.lead_enrichment_snapshots(lead_id);

ALTER TABLE public.lead_enrichment_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can manage lead_enrichment_snapshots" ON public.lead_enrichment_snapshots;
CREATE POLICY "Org members can manage lead_enrichment_snapshots"
  ON public.lead_enrichment_snapshots FOR ALL
  USING (public.is_org_member(org_id, auth.uid()));

-- -----------------------------------------------------------------------------
-- 6. WALKTHROUGHS: link to lead, extend status
-- -----------------------------------------------------------------------------
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS building_address TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS primary_contact_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS assigned_rep_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS sqft_estimate NUMERIC;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS service_frequency_target TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS follow_up_outcome TEXT;

CREATE INDEX IF NOT EXISTS idx_walkthroughs_lead ON public.walkthroughs(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_walkthroughs_scheduled ON public.walkthroughs(org_id, scheduled_at);

-- Walkthrough status: allow new values via trigger or app; avoid breaking existing CHECK if any
DO $$
BEGIN
  ALTER TABLE public.walkthroughs DROP CONSTRAINT IF EXISTS walkthroughs_status_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 7. OPPORTUNITIES: extend stage, next action, loss reason
-- -----------------------------------------------------------------------------
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS primary_contact_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS service_frequency TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS building_size_sqft NUMERIC;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS probability INT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS walkthrough_id UUID REFERENCES public.walkthroughs(id) ON DELETE SET NULL;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS competitor_current_vendor TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS loss_reason TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS next_action_due DATE;

CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close ON public.opportunities(org_id, expected_close_date) WHERE expected_close_date IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 8. PROPOSALS: extend status for revenue workflow
-- -----------------------------------------------------------------------------
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS status_detail TEXT;
-- App layer can map: draft, internal_review, sent, viewed, revision_requested, accepted, declined
-- Keep existing status column; status_detail or new column for finer state if needed
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 9. Territories (if not present) — for map/assignment
-- -----------------------------------------------------------------------------
-- Territories table may already exist from 100; no-op if so
-- COMMENT for sales: use territories for rep assignment and map overlays

COMMENT ON TABLE public.lead_activities IS 'Sales: call, email, note timeline per lead.';
COMMENT ON TABLE public.lead_import_batches IS 'Sales: CSV import batches for bulk tagging and Unworked Imports view.';
COMMENT ON TABLE public.lead_enrichment_snapshots IS 'Sales: cached enrichment from ZoomInfo/Google/LinkedIn; do not hard-wire vendors in core logic.';
