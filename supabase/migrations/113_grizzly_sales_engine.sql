-- =============================================================================
-- 113: GRIZZLY Sales Engine — Full lead model, activities, batches, enrichment,
--      walkthroughs, opportunities, proposal tracking. Additive only.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LEADS: GRIZZLY full model (additive columns)
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_detail TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source_campaign TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS legal_business_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS dba_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_first_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_last_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_full_name TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mobile TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS subindustry TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS annual_revenue NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS est_monthly_cleaning_value NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS service_frequency_guess TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS pain_points TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS enrichment_last_run_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS duplicate_group_key TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS duplicate_flags_json JSONB DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_possible_duplicate BOOLEAN DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS first_touched_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_due_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_contact_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_walkthrough_id UUID REFERENCES public.walkthroughs(id) ON DELETE SET NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lost_notes TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(org_id, assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON public.leads(org_id, last_activity_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_due ON public.leads(org_id, next_action_due_at) WHERE next_action_due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_duplicate ON public.leads(org_id, is_possible_duplicate) WHERE is_possible_duplicate = true;
CREATE INDEX IF NOT EXISTS idx_leads_archived ON public.leads(org_id, is_archived) WHERE is_archived = false;

-- Backfill assigned_to from assigned_user_id if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'assigned_user_id') THEN
    UPDATE public.leads SET assigned_to = assigned_user_id WHERE assigned_to IS NULL AND assigned_user_id IS NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- 2. lead_activities: GRIZZLY activity types + outcome, due, completed
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.lead_activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  ALTER TABLE public.lead_activities DROP CONSTRAINT IF EXISTS lead_activities_activity_type_check;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE public.lead_activities ADD CONSTRAINT lead_activities_activity_type_check CHECK (activity_type IN (
  'call', 'email', 'text', 'sms', 'linkedin_touch', 'note', 'meeting', 'walkthrough_invite',
  'follow_up', 'status_change', 'enrichment', 'assignment', 'qualification', 'conversion', 'touch', 'converted'
));

-- -----------------------------------------------------------------------------
-- 3. lead_import_batches: GRIZZLY full model
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS total_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS created_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS updated_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS skipped_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS duplicate_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS failed_rows INT DEFAULT 0;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS mapping_json JSONB DEFAULT '{}';
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS summary_json JSONB DEFAULT '{}';
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.lead_import_batches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- -----------------------------------------------------------------------------
-- 4. lead_enrichment_snapshots: provider_record_id, normalized, confidence
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_enrichment_snapshots ADD COLUMN IF NOT EXISTS provider_record_id TEXT;
ALTER TABLE public.lead_enrichment_snapshots ADD COLUMN IF NOT EXISTS normalized_payload_json JSONB DEFAULT '{}';
ALTER TABLE public.lead_enrichment_snapshots ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;

-- -----------------------------------------------------------------------------
-- 5. WALKTHROUGHS: GRIZZLY full model
-- -----------------------------------------------------------------------------
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS building_name TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS square_footage_estimate NUMERIC;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS target_service_frequency TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS special_notes TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS parking_notes TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS access_notes TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS outcome TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS next_step TEXT;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS next_step_due_at TIMESTAMPTZ;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS scope_ready BOOLEAN DEFAULT false;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS lidar_ready BOOLEAN DEFAULT false;
ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS linked_scope_packet_id UUID;

CREATE INDEX IF NOT EXISTS idx_walkthroughs_assigned ON public.walkthroughs(org_id, assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_walkthroughs_scheduled_start ON public.walkthroughs(org_id, scheduled_start) WHERE scheduled_start IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. OPPORTUNITIES: GRIZZLY full model
-- -----------------------------------------------------------------------------
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS service_frequency TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS estimated_sqft NUMERIC;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS est_monthly_revenue NUMERIC;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS est_annual_value NUMERIC;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS weighted_value NUMERIC;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS probability_percent INT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS current_vendor TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS competitor_name TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS loss_notes TEXT;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS next_action_due_at TIMESTAMPTZ;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS last_stage_changed_at TIMESTAMPTZ;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS is_stale BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_opportunities_lead ON public.opportunities(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_last_activity ON public.opportunities(org_id, last_activity_at DESC NULLS LAST);

-- -----------------------------------------------------------------------------
-- 7. PROPOSALS: GRIZZLY tracking columns (proposals table exists from 008)
-- -----------------------------------------------------------------------------
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposal_number TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS total_value NUMERIC;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS monthly_value NUMERIC;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS annual_value NUMERIC;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS revision_count INT DEFAULT 0;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS follow_up_due_at TIMESTAMPTZ;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_opportunity ON public.proposals(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_sent_at ON public.proposals(org_id, sent_at DESC NULLS LAST) WHERE sent_at IS NOT NULL;

COMMENT ON TABLE public.lead_activities IS 'GRIZZLY: Full activity timeline per lead.';
COMMENT ON TABLE public.lead_import_batches IS 'GRIZZLY: CSV import batches with row counts and mapping.';
COMMENT ON TABLE public.lead_enrichment_snapshots IS 'GRIZZLY: Enrichment cache; adapters in /lib/integrations/leads.';
