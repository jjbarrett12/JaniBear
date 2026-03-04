-- =============================================================================
-- PASTE THIS INTO SUPABASE SQL EDITOR AND RUN (all at once or section by section)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) 059: Templates write = owner/manager only (inspectors cannot edit templates)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_admin_org(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.can_admin_org IS 'True if user is owner or manager of the org (admin-level write, e.g. templates).';

DROP POLICY IF EXISTS "Can write templates" ON public.templates;
CREATE POLICY "Can write templates"
  ON public.templates FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "Can write template sections" ON public.template_sections;
CREATE POLICY "Can write template sections"
  ON public.template_sections FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "Can write template items" ON public.template_items;
CREATE POLICY "Can write template items"
  ON public.template_items FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));


-- -----------------------------------------------------------------------------
-- 2) 061: Benchmark minimum cohort (n >= 10) to prevent re-identification
-- -----------------------------------------------------------------------------
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
    HAVING COUNT(*) >= 10
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

COMMENT ON FUNCTION public.refresh_benchmark_aggregates() IS 'Recomputes benchmark_aggregates from opted-in orgs only. Cohorts with fewer than 10 orgs are excluded to prevent re-identification.';


-- -----------------------------------------------------------------------------
-- 3) 064: Alerts anti-spam — one open alert per entity
-- -----------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_one_open_per_entity
  ON public.alerts (org_id, entity_type, entity_id)
  WHERE status = 'open' AND entity_id IS NOT NULL;

COMMENT ON INDEX public.idx_alerts_one_open_per_entity IS 'Prevents duplicate open alerts per entity; use upsert or check before insert in alert generation.';
