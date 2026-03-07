-- Service agreements: production-safe source tracking and scope.
-- Adds source_opportunity_id, source_proposal_id, general_scope_summary for audit and ops.
-- Existing columns: start_date/end_date = effective dates; service_days = days_serviced.
-- No change to PDF/contract artifacts; agreement is the structured twin.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_agreements' AND column_name = 'source_opportunity_id'
  ) THEN
    ALTER TABLE public.service_agreements
      ADD COLUMN source_opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_service_agreements_source_opportunity
      ON public.service_agreements(source_opportunity_id) WHERE source_opportunity_id IS NOT NULL;
    COMMENT ON COLUMN public.service_agreements.source_opportunity_id IS 'Opportunity this agreement was created from (launch/proposal close).';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_agreements' AND column_name = 'source_proposal_id'
  ) THEN
    ALTER TABLE public.service_agreements
      ADD COLUMN source_proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_service_agreements_source_proposal
      ON public.service_agreements(source_proposal_id) WHERE source_proposal_id IS NOT NULL;
    COMMENT ON COLUMN public.service_agreements.source_proposal_id IS 'Proposal (and PDF) this agreement was created from; contract artifact remains separate.';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_agreements' AND column_name = 'general_scope_summary'
  ) THEN
    ALTER TABLE public.service_agreements
      ADD COLUMN general_scope_summary TEXT;
    COMMENT ON COLUMN public.service_agreements.general_scope_summary IS 'Human-readable scope summary for ops/scheduling; can be synced from proposal/walkthrough JSON until full migration.';
  END IF;
END $$;

-- Status constraint already exists in 115 (draft, active, paused, ended, cancelled). No change.
-- effective_start_date / effective_end_date: use start_date / end_date (existing). No rename to avoid breaking service_lines/backfill.
