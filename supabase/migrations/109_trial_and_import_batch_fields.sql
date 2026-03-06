-- =============================================================================
-- 109: 14-day full trial system + import_batches schema for command center
-- - organizations: trial_started_at, trial_ends_at, trial_mode
-- - import_batches: detected_platform, detected_platform_confidence, row_count, columns
-- - Trigger: set trial dates on new org when billing_status is trial
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Organizations: 14-day trial fields
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS trial_mode BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.organizations.trial_started_at IS 'When the 14-day full-platform trial started.';
COMMENT ON COLUMN public.organizations.trial_ends_at IS 'When the trial ends (trial_started_at + 14 days).';
COMMENT ON COLUMN public.organizations.trial_mode IS 'True during trial; false after expiry or when subscription is active.';

-- Backfill existing orgs: if billing_status = trial and trial_started_at is null, set from created_at or now
UPDATE public.organizations
SET
  trial_started_at = COALESCE(trial_started_at, created_at, now()),
  trial_ends_at = COALESCE(trial_ends_at, COALESCE(trial_started_at, created_at, now()) + interval '14 days'),
  trial_mode = CASE WHEN billing_status = 'active' THEN false ELSE COALESCE(trial_mode, true) END
WHERE trial_started_at IS NULL AND billing_status = 'trial';

-- Trigger: on INSERT, set trial dates when billing_status is trial
CREATE OR REPLACE FUNCTION public.set_trial_dates_on_org_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.billing_status = 'trial' AND NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at := now();
    NEW.trial_ends_at := now() + interval '14 days';
    NEW.trial_mode := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_trial_dates_on_org_insert ON public.organizations;
CREATE TRIGGER set_trial_dates_on_org_insert
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_trial_dates_on_org_insert();

-- RPC create_org_for_signup inserts with status 'trialing' - ensure billing_status is set for new orgs
-- (096 adds billing_status default 'trial', so new rows get it; trigger above sets trial dates.)

-- -----------------------------------------------------------------------------
-- 2) import_batches: platform detection + row_count, columns for command center
-- -----------------------------------------------------------------------------
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS detected_platform TEXT;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS detected_platform_confidence NUMERIC(5,4);
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS row_count INTEGER;
ALTER TABLE public.import_batches ADD COLUMN IF NOT EXISTS columns JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.import_batches.detected_platform IS 'Detected source: jobber, swept, zenmaid, generic_spreadsheet.';
COMMENT ON COLUMN public.import_batches.detected_platform_confidence IS '0-1 confidence from platform detection.';
COMMENT ON COLUMN public.import_batches.row_count IS 'Number of data rows in the uploaded file.';
COMMENT ON COLUMN public.import_batches.columns IS 'Raw column headers from the file (for UI and re-detection).';

-- Add 'parsed' to status check if not already present (spec lists uploaded, parsed, mapped, ...)
ALTER TABLE public.import_batches DROP CONSTRAINT IF EXISTS import_batches_status_check;
ALTER TABLE public.import_batches ADD CONSTRAINT import_batches_status_check
  CHECK (status IN ('uploaded', 'parsed', 'mapped', 'importing', 'done', 'failed', 'rolled_back'));
