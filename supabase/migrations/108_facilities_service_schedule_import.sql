-- =============================================================================
-- 108: Facility service schedule fields for onboarding import
-- Stores normalized schedule from imported service_schedule_raw.
-- =============================================================================

ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS service_schedule_raw TEXT;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS service_frequency_per_week TEXT
  CHECK (service_frequency_per_week IS NULL OR service_frequency_per_week IN ('1xweek','2xweek','3xweek','4xweek','5xweek','6xweek','7xweek'));
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS service_days TEXT[] DEFAULT '{}';
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS days_serviced_count INT;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS schedule_needs_review BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.facilities ADD COLUMN IF NOT EXISTS schedule_review_reason TEXT;

COMMENT ON COLUMN public.facilities.service_schedule_raw IS 'Original imported schedule text from spreadsheet';
COMMENT ON COLUMN public.facilities.service_frequency_per_week IS 'Normalized: 1xweek..7xweek from importer';
COMMENT ON COLUMN public.facilities.service_days IS 'Array of day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun';
COMMENT ON COLUMN public.facilities.days_serviced_count IS 'Derived from service_days length when known';
COMMENT ON COLUMN public.facilities.schedule_needs_review IS 'True when schedule ambiguous or conflicting during import';
COMMENT ON COLUMN public.facilities.schedule_review_reason IS 'Reason schedule was flagged for review (e.g. daily/nightly, conflict, non-weekly)';
