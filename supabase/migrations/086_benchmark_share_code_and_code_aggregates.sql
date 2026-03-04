-- ============================================
-- Benchmark by share code: allow orgs to benchmark with others that share a code.
-- Anonymous benchmarking (opt-in + peer group) unchanged. This adds an optional code-based group.
-- Replacement for legacy 0761_* migration id.
-- ============================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS benchmark_share_code TEXT;

COMMENT ON COLUMN organizations.benchmark_share_code IS 'Optional. When set, org is included in code-based benchmark aggregate. Share this code with other JANIBEAR orgs to compare only with them.';

CREATE INDEX IF NOT EXISTS idx_organizations_benchmark_share_code
  ON organizations(benchmark_share_code) WHERE benchmark_share_code IS NOT NULL AND TRIM(benchmark_share_code) <> '';

CREATE TABLE IF NOT EXISTS public.benchmark_code_aggregates (
  share_code TEXT NOT NULL PRIMARY KEY,
  avg_close_rate NUMERIC,
  avg_inspection_score NUMERIC,
  avg_gross_margin NUMERIC,
  avg_cost_per_sqft NUMERIC,
  org_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.benchmark_code_aggregates IS 'Benchmark aggregates by share code. Only orgs with that code can read. Populated by refresh_benchmark_code_aggregates.';

ALTER TABLE public.benchmark_code_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own code group aggregates" ON public.benchmark_code_aggregates;
CREATE POLICY "Read own code group aggregates"
  ON public.benchmark_code_aggregates FOR SELECT
  TO authenticated
  USING (
    share_code IN (
      SELECT o.benchmark_share_code
      FROM organizations o
      INNER JOIN org_members m ON m.org_id = o.id
      WHERE m.user_id = auth.uid()
        AND (m.status = 'active' OR m.status IS NULL)
        AND o.benchmark_share_code IS NOT NULL
        AND TRIM(o.benchmark_share_code) <> ''
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_benchmark_code_aggregates()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  TRUNCATE public.benchmark_code_aggregates;

  WITH with_code AS (
    SELECT id, TRIM(benchmark_share_code) AS code
    FROM organizations
    WHERE benchmark_share_code IS NOT NULL AND TRIM(benchmark_share_code) <> ''
  ),
  close_rates AS (
    SELECT sp.org_id,
      CASE WHEN COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')) > 0
        THEN COUNT(*) FILTER (WHERE sp.status = 'won' AND sp.delivered_at >= (NOW() - INTERVAL '90 days'))::NUMERIC
          / NULLIF(COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')), 0)
        ELSE NULL END AS close_rate
    FROM sales_proposals sp
    INNER JOIN with_code w ON w.id = sp.org_id
    GROUP BY sp.org_id
  ),
  insp_scores AS (
    SELECT i.org_id,
      AVG(COALESCE(i.score, i.total_score)) AS avg_score
    FROM inspections i
    INNER JOIN with_code w ON w.id = i.org_id
    WHERE (i.completed_at IS NOT NULL AND i.completed_at >= (NOW() - INTERVAL '90 days'))
    GROUP BY i.org_id
  ),
  org_metrics AS (
    SELECT w.id, w.code,
      cr.close_rate,
      ins.avg_score AS inspection_score
    FROM with_code w
    LEFT JOIN close_rates cr ON cr.org_id = w.id
    LEFT JOIN insp_scores ins ON ins.org_id = w.id
  ),
  agg AS (
    SELECT
      om.code AS share_code,
      AVG(om.close_rate) AS avg_close_rate,
      AVG(om.inspection_score) AS avg_inspection_score,
      NULL::NUMERIC AS avg_gross_margin,
      NULL::NUMERIC AS avg_cost_per_sqft,
      COUNT(*)::INT AS org_count
    FROM org_metrics om
    GROUP BY om.code
  )
  INSERT INTO public.benchmark_code_aggregates (
    share_code,
    avg_close_rate,
    avg_inspection_score,
    avg_gross_margin,
    avg_cost_per_sqft,
    org_count,
    updated_at
  )
  SELECT
    a.share_code,
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

COMMENT ON FUNCTION public.refresh_benchmark_code_aggregates() IS 'Recomputes benchmark_code_aggregates from orgs that have benchmark_share_code set. Call from cron with refresh_benchmark_aggregates.';
