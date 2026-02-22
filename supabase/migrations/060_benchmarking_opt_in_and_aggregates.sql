-- ============================================
-- Cross-Org Benchmarking (Anonymized)
-- Org setting: opt-in; aggregates table for peer metrics only. No raw org data exposed.
-- ============================================

-- 1) Org settings: benchmarking opt-in + peer group dimensions
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS benchmarking_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_size_bucket TEXT,
  ADD COLUMN IF NOT EXISTS vertical TEXT;

COMMENT ON COLUMN organizations.benchmarking_opt_in IS 'If true, org is included in anonymized benchmark aggregates. Default false.';
COMMENT ON COLUMN organizations.company_size_bucket IS 'Peer group: e.g. 1-10, 11-50, 51-200, 201+. Used only for benchmarking.';
COMMENT ON COLUMN organizations.vertical IS 'Peer group: e.g. medical, industrial, education, retail, other. Used only for benchmarking.';

CREATE INDEX IF NOT EXISTS idx_organizations_benchmarking_opt_in
  ON organizations(benchmarking_opt_in) WHERE benchmarking_opt_in = true;

-- 2) Benchmark aggregates: anonymized metrics by (company_size_bucket, vertical). Refreshed by cron only.
CREATE TABLE IF NOT EXISTS public.benchmark_aggregates (
  company_size_bucket TEXT NOT NULL,
  vertical TEXT NOT NULL,
  avg_close_rate NUMERIC,
  avg_inspection_score NUMERIC,
  avg_gross_margin NUMERIC,
  avg_cost_per_sqft NUMERIC,
  org_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_size_bucket, vertical)
);

COMMENT ON TABLE public.benchmark_aggregates IS 'Anonymized benchmark metrics by peer group. Only aggregated data; no org-level rows. Populated by cron/job.';

CREATE INDEX IF NOT EXISTS idx_benchmark_aggregates_updated_at
  ON public.benchmark_aggregates(updated_at DESC);

-- 3) RLS: anyone authenticated can read aggregates (no org_id; data is anonymized). Writes only via service role.
ALTER TABLE public.benchmark_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read benchmark aggregates"
  ON public.benchmark_aggregates FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE for authenticated; only service role (cron) can write.
-- So we do not create policies for INSERT/UPDATE/DELETE; service role bypasses RLS.

-- 4) Function to refresh benchmark_aggregates from opted-in orgs only. Aggregation only; no raw org data.
-- Call from cron (service role) or from an endpoint that uses service role.
CREATE OR REPLACE FUNCTION public.refresh_benchmark_aggregates()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  TRUNCATE public.benchmark_aggregates;

  WITH opted AS (
    SELECT id,
      COALESCE(NULLIF(TRIM(company_size_bucket), ''), 'unknown') AS bucket,
      COALESCE(NULLIF(TRIM(vertical), ''), 'unknown') AS vertical
    FROM organizations
    WHERE benchmarking_opt_in = true
  ),
  close_rates AS (
    SELECT sp.org_id,
      CASE WHEN COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')) > 0
        THEN COUNT(*) FILTER (WHERE sp.status = 'won' AND sp.delivered_at >= (NOW() - INTERVAL '90 days'))::NUMERIC
          / NULLIF(COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')), 0)
        ELSE NULL END AS close_rate
    FROM sales_proposals sp
    INNER JOIN opted o ON o.id = sp.org_id
    GROUP BY sp.org_id
  ),
  insp_scores AS (
    SELECT i.org_id,
      AVG(COALESCE(i.score, i.total_score)) AS avg_score
    FROM inspections i
    INNER JOIN opted o ON o.id = i.org_id
    WHERE (i.completed_at IS NOT NULL AND i.completed_at >= (NOW() - INTERVAL '90 days'))
    GROUP BY i.org_id
  ),
  org_metrics AS (
    SELECT o.id, o.bucket, o.vertical,
      cr.close_rate,
      ins.avg_score AS inspection_score
    FROM opted o
    LEFT JOIN close_rates cr ON cr.org_id = o.id
    LEFT JOIN insp_scores ins ON ins.org_id = o.id
  ),
  agg AS (
    SELECT
      om.bucket AS company_size_bucket,
      om.vertical,
      AVG(om.close_rate) AS avg_close_rate,
      AVG(om.inspection_score) AS avg_inspection_score,
      NULL::NUMERIC AS avg_gross_margin,
      NULL::NUMERIC AS avg_cost_per_sqft,
      COUNT(*)::INT AS org_count
    FROM org_metrics om
    GROUP BY om.bucket, om.vertical
  )
  INSERT INTO public.benchmark_aggregates (
    company_size_bucket,
    vertical,
    avg_close_rate,
    avg_inspection_score,
    avg_gross_margin,
    avg_cost_per_sqft,
    org_count,
    updated_at
  )
  SELECT
    a.company_size_bucket,
    a.vertical,
    a.avg_close_rate,
    a.avg_inspection_score,
    a.avg_gross_margin,
    a.avg_cost_per_sqft,
    a.org_count,
    NOW()
  FROM agg a;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;

COMMENT ON FUNCTION public.refresh_benchmark_aggregates() IS 'Recomputes benchmark_aggregates from opted-in orgs only. Call from cron. Returns number of rows upserted.';
