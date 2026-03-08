-- =============================================================================
-- 128: Account Intelligence Profile — extended columns and task types
-- Production-grade: industry, occupancy, complexity, scope, labor, fit, tasks.
-- Compatibility-safe: additive only; no table renames.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Extend account_intelligence_profiles with structured columns
-- -----------------------------------------------------------------------------

-- Account/building
ALTER TABLE public.account_intelligence_profiles
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS occupancy_pattern TEXT,
  ADD COLUMN IF NOT EXISTS complexity_tier TEXT;

-- Cleaning/scope
ALTER TABLE public.account_intelligence_profiles
  ADD COLUMN IF NOT EXISTS kitchen_breakroom_count INT,
  ADD COLUMN IF NOT EXISTS flooring_mix JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS trash_volume TEXT,
  ADD COLUMN IF NOT EXISTS touchpoint_density TEXT,
  ADD COLUMN IF NOT EXISTS special_cleaning_requirements TEXT,
  ADD COLUMN IF NOT EXISTS frequency_recommendation TEXT;

-- Operational effort
ALTER TABLE public.account_intelligence_profiles
  ADD COLUMN IF NOT EXISTS estimated_labor_hours_per_week NUMERIC,
  ADD COLUMN IF NOT EXISTS likely_crew_type TEXT,
  ADD COLUMN IF NOT EXISTS equipment_supply_implications TEXT,
  ADD COLUMN IF NOT EXISTS inspection_zone_suggestions JSONB DEFAULT '[]'::jsonb;

-- Operational fit
ALTER TABLE public.account_intelligence_profiles
  ADD COLUMN IF NOT EXISTS travel_burden_minutes NUMERIC,
  ADD COLUMN IF NOT EXISTS staffing_fit_score INT,
  ADD COLUMN IF NOT EXISTS start_date_risk TEXT;

COMMENT ON COLUMN public.account_intelligence_profiles.industry IS 'Industry/vertical from lead or enrichment.';
COMMENT ON COLUMN public.account_intelligence_profiles.occupancy_pattern IS 'e.g. 9-5, 24/7, weekend-only.';
COMMENT ON COLUMN public.account_intelligence_profiles.complexity_tier IS 'low/medium/high from LiDAR or scope.';
COMMENT ON COLUMN public.account_intelligence_profiles.kitchen_breakroom_count IS 'Count of kitchens/breakrooms.';
COMMENT ON COLUMN public.account_intelligence_profiles.frequency_recommendation IS 'AI-recommended frequency; may differ from signed.';
COMMENT ON COLUMN public.account_intelligence_profiles.estimated_labor_hours_per_week IS 'Weekly labor estimate.';
COMMENT ON COLUMN public.account_intelligence_profiles.likely_crew_type IS 'e.g. standard, specialty, multi-site.';
COMMENT ON COLUMN public.account_intelligence_profiles.inspection_zone_suggestions IS 'Suggested QC zones from spaces/LiDAR.';
COMMENT ON COLUMN public.account_intelligence_profiles.travel_burden_minutes IS 'Estimated travel burden from assignment engine.';
COMMENT ON COLUMN public.account_intelligence_profiles.staffing_fit_score IS '0-100 staffing fit.';

-- -----------------------------------------------------------------------------
-- 2) Expand ai_readiness_tasks.task_type (drop old CHECK, add new)
-- -----------------------------------------------------------------------------

-- Drop existing task_type check (name may vary by PG version)
DO $$
DECLARE
  conname TEXT;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'ai_readiness_tasks'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%task_type%';
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.ai_readiness_tasks DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.ai_readiness_tasks
  ADD CONSTRAINT ai_readiness_tasks_task_type_check
  CHECK (task_type IN (
    'missing_data',
    'proposal_readiness',
    'activation_readiness',
    'missing_lidar',
    'confirm_sqft',
    'verify_flooring',
    'confirm_service_window',
    'confirm_restroom_count',
    'assign_supervisor',
    'finalize_schedule',
    'verify_scope'
  ));

COMMENT ON COLUMN public.ai_readiness_tasks.task_type IS 'Task type: generic or specific (missing_lidar, confirm_sqft, verify_flooring, etc.).';
