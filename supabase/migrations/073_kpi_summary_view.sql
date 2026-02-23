-- KPI Command Center: single-row-per-org summary view.
-- Enables one query for executive snapshot + key metrics (org-scoped).
-- Populate via materialized job or replace view with real aggregates from contracts/invoices/accounts.

CREATE OR REPLACE VIEW public.kpi_summary_view AS
SELECT
  o.id AS org_id,
  NULL::numeric AS mrr,
  NULL::numeric AS gross_margin_percent,
  NULL::numeric AS net_mrr_change_30d,
  NULL::integer AS accounts_at_risk_count,
  NULL::numeric AS crew_utilization_percent,
  NULL::numeric AS inspection_pass_rate,
  NULL::numeric AS ar_over_60_percent,
  NULL::numeric AS pipeline_value,
  NULL::numeric AS close_rate_percent,
  NULL::numeric AS avg_contract_size,
  NULL::integer AS sales_cycle_days,
  NULL::integer AS sla_breaches_count,
  NULL::integer AS open_issues_count,
  NULL::numeric AS contracts_expiring_90d_count,
  NULL::numeric AS client_health_decay_risk_count
FROM public.organizations o;

COMMENT ON VIEW public.kpi_summary_view IS 'One row per org for KPI Command Center. Replace with real aggregates when backend supports.';
