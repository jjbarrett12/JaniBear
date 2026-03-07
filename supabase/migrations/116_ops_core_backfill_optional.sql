-- =============================================================================
-- 116: Optional backfill from crew_assignments/facilities into service_agreements, service_lines, service_assignments
-- Run after 115. Idempotent: checks for existing data. No hard deletes of legacy tables.
-- =============================================================================

-- Backfill service_agreements (one per facility that has crew_assignments or exists)
INSERT INTO public.service_agreements (
  org_id, account_id, facility_id, name, status, start_date, end_date,
  service_frequency, service_days, created_at, updated_at
)
SELECT
  f.org_id,
  f.account_id,
  f.id AS facility_id,
  f.name || ' Agreement' AS name,
  'active' AS status,
  COALESCE(
    (SELECT MIN(ca.start_date) FROM public.crew_assignments ca WHERE ca.facility_id = f.id),
    f.created_at::date
  ) AS start_date,
  NULL AS end_date,
  f.service_frequency_per_week,
  f.service_days,
  now(),
  now()
FROM public.facilities f
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_agreements sa WHERE sa.facility_id = f.id
);

-- Backfill service_lines (one nightly_janitorial per agreement that has none)
INSERT INTO public.service_lines (org_id, service_agreement_id, line_type, name, sort_order, is_active, created_at, updated_at)
SELECT
  sa.org_id,
  sa.id AS service_agreement_id,
  'nightly_janitorial' AS line_type,
  'Nightly Janitorial' AS name,
  0 AS sort_order,
  true AS is_active,
  now(),
  now()
FROM public.service_agreements sa
WHERE NOT EXISTS (SELECT 1 FROM public.service_lines sl WHERE sl.service_agreement_id = sa.id);

-- Backfill service_assignments from crew_assignments (one row per crew_assignment; link to first service_line of agreement)
INSERT INTO public.service_assignments (
  org_id, facility_id, service_line_id, crew_id, supervisor_id, effective_from, effective_to, created_at, updated_at
)
SELECT
  ca.org_id,
  ca.facility_id,
  (SELECT sl.id FROM public.service_lines sl
   JOIN public.service_agreements sa ON sa.id = sl.service_agreement_id AND sa.facility_id = ca.facility_id
   ORDER BY sl.sort_order LIMIT 1) AS service_line_id,
  ca.crew_id,
  NULL AS supervisor_id,
  COALESCE(ca.start_date, current_date) AS effective_from,
  ca.end_date AS effective_to,
  now(),
  now()
FROM public.crew_assignments ca
WHERE NOT EXISTS (
  SELECT 1 FROM public.service_assignments sas
  WHERE sas.facility_id = ca.facility_id AND sas.crew_id = ca.crew_id
    AND sas.effective_from = COALESCE(ca.start_date, current_date)
);
