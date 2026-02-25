-- ============================================
-- SALES COMMAND CENTER: proposals-driven pipeline, targets, metrics, leaderboard
-- Reps see own numbers + team rankings (no other reps' revenue/commission). Admins see all.
-- ============================================

-- 1) Allow 'sales_rep' in org_members.role (for Sales Command Center gating)
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'sales_rep', 'sales', 'ops', 'inspector', 'cleaner', 'client', 'client_viewer'));

-- 2) Pipeline proposals table (separate from existing lead-linked proposals)
CREATE TABLE IF NOT EXISTS sales_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  name TEXT,
  proposal_value NUMERIC NOT NULL DEFAULT 0,
  estimated_mrr NUMERIC NOT NULL DEFAULT 0,
  stage TEXT NOT NULL CHECK (stage IN ('prospect','walkthrough','drafted','delivered','negotiating','verbal_yes','signed','lost')),
  status TEXT NOT NULL CHECK (status IN ('active','won','lost')),
  probability NUMERIC NOT NULL DEFAULT 0.1,
  delivered_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_proposals_org_rep ON sales_proposals(org_id, rep_id);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_org_status_stage ON sales_proposals(org_id, status, stage);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_org_delivered ON sales_proposals(org_id, delivered_at);
CREATE INDEX IF NOT EXISTS idx_sales_proposals_org_closed ON sales_proposals(org_id, closed_at);

-- 3) Sales targets (one row per rep per org)
CREATE TABLE IF NOT EXISTS sales_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_mrr_target NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, rep_id)
);

CREATE INDEX IF NOT EXISTS idx_sales_targets_org_rep ON sales_targets(org_id, rep_id);

-- 4) Sales activity (optional, for future engagement metrics)
CREATE TABLE IF NOT EXISTS sales_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_activity_org_rep_created ON sales_activity(org_id, rep_id, created_at);

-- 5) updated_at trigger for sales_proposals
CREATE OR REPLACE FUNCTION set_sales_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_proposals_updated_at ON sales_proposals;
CREATE TRIGGER trg_sales_proposals_updated_at
  BEFORE UPDATE ON sales_proposals
  FOR EACH ROW EXECUTE PROCEDURE set_sales_proposals_updated_at();

-- 6) Probability by stage (set/update when stage changes)
CREATE OR REPLACE FUNCTION get_probability_for_stage(p_stage TEXT)
RETURNS NUMERIC AS $$
  SELECT CASE p_stage
    WHEN 'prospect' THEN 0.10
    WHEN 'walkthrough' THEN 0.20
    WHEN 'drafted' THEN 0.35
    WHEN 'delivered' THEN 0.50
    WHEN 'negotiating' THEN 0.65
    WHEN 'verbal_yes' THEN 0.80
    WHEN 'signed' THEN 1.00
    WHEN 'lost' THEN 0.00
    ELSE 0.10
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_sales_proposal_probability()
RETURNS TRIGGER AS $$
BEGIN
  NEW.probability = get_probability_for_stage(NEW.stage);
  IF NEW.stage = 'signed' THEN NEW.status = 'won'; END IF;
  IF NEW.stage = 'lost' THEN NEW.status = 'lost'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_proposal_probability ON sales_proposals;
CREATE TRIGGER trg_sales_proposal_probability
  BEFORE INSERT OR UPDATE OF stage ON sales_proposals
  FOR EACH ROW EXECUTE PROCEDURE set_sales_proposal_probability();

-- 7) Rep sales metrics view (one row per rep per org)
CREATE OR REPLACE VIEW rep_sales_metrics AS
WITH all_reps AS (
  SELECT DISTINCT org_id, rep_id FROM sales_proposals
  UNION
  SELECT org_id, rep_id FROM sales_targets
),
base AS (
  SELECT
    sp.org_id,
    sp.rep_id,
    COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '7 days')) AS proposals_delivered_7d,
    COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '30 days')) AS proposals_delivered_30d,
    COALESCE(SUM(sp.estimated_mrr) FILTER (WHERE sp.status = 'won' AND sp.closed_at >= date_trunc('month', NOW())), 0) AS mrr_closed_mtd,
    COALESCE(SUM(sp.estimated_mrr) FILTER (WHERE sp.status = 'won' AND sp.closed_at >= (NOW() - INTERVAL '30 days')), 0) AS mrr_closed_30d,
    COALESCE(SUM(sp.estimated_mrr * sp.probability) FILTER (WHERE sp.status = 'active'), 0) AS weighted_pipeline,
    COUNT(*) FILTER (WHERE sp.status = 'won' AND sp.delivered_at >= (NOW() - INTERVAL '30 days')) AS won_30d,
    AVG(sp.estimated_mrr) FILTER (WHERE sp.status = 'won' AND sp.closed_at >= (NOW() - INTERVAL '30 days')) AS avg_contract_size_30d,
    AVG(EXTRACT(EPOCH FROM (sp.closed_at - sp.delivered_at)) / 86400.0) FILTER (WHERE sp.status = 'won' AND sp.closed_at >= (NOW() - INTERVAL '30 days') AND sp.delivered_at IS NOT NULL) AS avg_sales_cycle_days_30d
  FROM sales_proposals sp
  GROUP BY sp.org_id, sp.rep_id
)
SELECT
  r.org_id,
  r.rep_id,
  COALESCE(b.proposals_delivered_7d, 0)::INT AS proposals_delivered_7d,
  COALESCE(b.proposals_delivered_30d, 0)::INT AS proposals_delivered_30d,
  COALESCE(b.mrr_closed_mtd, 0) AS mrr_closed_mtd,
  COALESCE(b.weighted_pipeline, 0) AS weighted_pipeline,
  (COALESCE(b.weighted_pipeline, 0) / NULLIF(COALESCE(st.monthly_mrr_target, 1), 0)) AS pipeline_coverage_ratio,
  CASE WHEN COALESCE(b.proposals_delivered_30d, 0) > 0 THEN (COALESCE(b.won_30d, 0)::NUMERIC / b.proposals_delivered_30d) ELSE NULL END AS close_rate_30d,
  b.avg_contract_size_30d,
  CASE WHEN COALESCE(b.proposals_delivered_30d, 0) > 0 THEN (COALESCE(b.mrr_closed_30d, 0) / b.proposals_delivered_30d) ELSE NULL END AS revenue_per_proposal_30d,
  b.avg_sales_cycle_days_30d,
  COALESCE(st.monthly_mrr_target, 0) AS monthly_mrr_target,
  COALESCE(st.commission_rate, 0.10) AS commission_rate
FROM all_reps r
LEFT JOIN base b ON b.org_id = r.org_id AND b.rep_id = r.rep_id
LEFT JOIN sales_targets st ON st.org_id = r.org_id AND st.rep_id = r.rep_id;

-- 8) Pipeline by stage (for chart)
CREATE OR REPLACE VIEW rep_pipeline_by_stage AS
SELECT
  org_id,
  rep_id,
  stage,
  COUNT(*)::INT AS count_active,
  COALESCE(SUM(estimated_mrr), 0) AS sum_estimated_mrr,
  COALESCE(SUM(estimated_mrr * probability), 0) AS sum_weighted_mrr
FROM sales_proposals
WHERE status = 'active'
GROUP BY org_id, rep_id, stage;

-- 9) Leaderboard (public-safe: rank, name, score only — no other reps' revenue)
CREATE OR REPLACE FUNCTION get_leaderboard_public(p_org_id UUID)
RETURNS TABLE (
  org_id UUID,
  rep_id UUID,
  rep_name TEXT,
  rank BIGINT,
  performance_score NUMERIC,
  badge TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_org_member(p_org_id) THEN
    RETURN;
  END IF;
  RETURN QUERY
  WITH metrics AS (
    SELECT
      m.org_id,
      m.rep_id,
      p.full_name AS rep_name,
      m.proposals_delivered_7d,
      m.mrr_closed_mtd,
      m.weighted_pipeline,
      m.close_rate_30d,
      m.monthly_mrr_target
    FROM rep_sales_metrics m
    LEFT JOIN profiles p ON p.id = m.rep_id
    WHERE m.org_id = p_org_id
  ),
  norm AS (
    SELECT
      *,
      (mrr_closed_mtd - MIN(mrr_closed_mtd) OVER w) / NULLIF(MAX(mrr_closed_mtd) OVER w - MIN(mrr_closed_mtd) OVER w, 0) AS n_mrr,
      (weighted_pipeline - MIN(weighted_pipeline) OVER w) / NULLIF(MAX(weighted_pipeline) OVER w - MIN(weighted_pipeline) OVER w, 0) AS n_pipeline,
      (proposals_delivered_7d - MIN(proposals_delivered_7d) OVER w)::NUMERIC / NULLIF(MAX(proposals_delivered_7d) OVER w - MIN(proposals_delivered_7d) OVER w, 0) AS n_delivered,
      (close_rate_30d - MIN(close_rate_30d) OVER w) / NULLIF(MAX(close_rate_30d) OVER w - MIN(close_rate_30d) OVER w, 0) AS n_close
    FROM metrics
    WINDOW w AS (PARTITION BY org_id)
  ),
  scored AS (
    SELECT
      org_id,
      rep_id,
      rep_name,
      COALESCE(
        COALESCE(n_mrr, 0) * 0.40 +
        COALESCE(n_pipeline, 0) * 0.25 +
        COALESCE(n_delivered, 0) * 0.20 +
        COALESCE(n_close, 0) * 0.15,
        0
      ) AS performance_score
    FROM norm
  )
  SELECT
    s.org_id,
    s.rep_id,
    s.rep_name,
    DENSE_RANK() OVER (ORDER BY s.performance_score DESC) AS rank,
    s.performance_score,
    CASE
      WHEN DENSE_RANK() OVER (ORDER BY s.performance_score DESC) = 1 THEN 'top'
      WHEN DENSE_RANK() OVER (ORDER BY s.performance_score DESC) <= 3 THEN 'top3'
      ELSE NULL
    END AS badge
  FROM scored s
  WHERE s.org_id = p_org_id;
END;
$$;

-- 10) RLS
ALTER TABLE sales_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activity ENABLE ROW LEVEL SECURITY;

-- Helper: user is admin/manager in org (can see all sales data in org)
CREATE OR REPLACE FUNCTION is_sales_admin_or_manager(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = p_user_id
      AND (status = 'active' OR status IS NULL)
      AND LOWER(TRIM(COALESCE(role, ''))) IN ('owner', 'admin', 'manager', 'op_admin', 'fr_admin', 'op_ops_manager')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- sales_proposals: rep sees own; admin/manager sees all in org
DROP POLICY IF EXISTS "Rep can CRUD own sales_proposals" ON sales_proposals;
CREATE POLICY "Rep can CRUD own sales_proposals"
  ON sales_proposals FOR ALL
  USING (rep_id = auth.uid() AND is_org_member(org_id));
DROP POLICY IF EXISTS "Admin/manager can read all sales_proposals in org" ON sales_proposals;
CREATE POLICY "Admin/manager can read all sales_proposals in org"
  ON sales_proposals FOR SELECT
  USING (is_sales_admin_or_manager(org_id, auth.uid()));

-- sales_targets: rep sees own; admin/manager all
DROP POLICY IF EXISTS "Rep can read own sales_targets" ON sales_targets;
CREATE POLICY "Rep can read own sales_targets"
  ON sales_targets FOR SELECT
  USING (rep_id = auth.uid() AND is_org_member(org_id));
DROP POLICY IF EXISTS "Admin/manager can all sales_targets in org" ON sales_targets;
CREATE POLICY "Admin/manager can all sales_targets in org"
  ON sales_targets FOR ALL
  USING (is_sales_admin_or_manager(org_id, auth.uid()));

-- sales_activity: rep sees own; admin all
DROP POLICY IF EXISTS "Rep can read own sales_activity" ON sales_activity;
CREATE POLICY "Rep can read own sales_activity"
  ON sales_activity FOR SELECT
  USING (rep_id = auth.uid() AND is_org_member(org_id));
DROP POLICY IF EXISTS "Admin can read all sales_activity" ON sales_activity;
CREATE POLICY "Admin can read all sales_activity"
  ON sales_activity FOR SELECT
  USING (is_sales_admin_or_manager(org_id, auth.uid()));

-- Views are not directly selectable with RLS; use SECURITY DEFINER functions for rep-scoped reads
CREATE OR REPLACE FUNCTION get_rep_sales_metrics_for_user(p_org_id UUID, p_rep_id UUID)
RETURNS SETOF rep_sales_metrics LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_org_member(p_org_id) THEN RETURN; END IF;
  IF auth.uid() <> p_rep_id AND NOT is_sales_admin_or_manager(p_org_id, auth.uid()) THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM rep_sales_metrics m
    WHERE m.org_id = p_org_id AND m.rep_id = p_rep_id
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION get_rep_pipeline_by_stage(p_org_id UUID, p_rep_id UUID)
RETURNS SETOF rep_pipeline_by_stage LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_org_member(p_org_id) THEN RETURN; END IF;
  IF auth.uid() <> p_rep_id AND NOT is_sales_admin_or_manager(p_org_id, auth.uid()) THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM rep_pipeline_by_stage
    WHERE org_id = p_org_id AND rep_id = p_rep_id;
END;
$$;

COMMENT ON TABLE sales_proposals IS 'Pipeline proposals (rep, stage, MRR). Separate from lead-linked proposals table.';
COMMENT ON VIEW rep_sales_metrics IS 'Per-rep metrics; use get_rep_sales_metrics_for_user or RLS for rep-scoped access.';
COMMENT ON FUNCTION get_leaderboard_public(UUID) IS 'Leaderboard with rank/name/score only; no other reps revenue.';
