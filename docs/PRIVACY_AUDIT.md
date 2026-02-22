# Privacy Audit — Benchmarking & Cross-Org Data

**Date:** 2025-02-20  
**Scope:** Aggregate re-identification risk, RLS on cross-org data, opt-out behavior.

---

## 1. Aggregates cannot be reverse engineered (minimum cohort size)

| Check | Status | Notes |
|-------|--------|--------|
| **Minimum cohort size (e.g. n ≥ 10)** | **FIX APPLIED** | Migration `061_benchmark_minimum_cohort.sql` updates `refresh_benchmark_aggregates()` so the `agg` CTE has `HAVING COUNT(*) >= 10`. Only (company_size_bucket, vertical) groups with at least 10 opted-in orgs are inserted into `benchmark_aggregates`. Smaller cohorts are not published, reducing re-identification risk. |
| **No org-level rows in aggregates** | **PASS** | `benchmark_aggregates` has no `org_id`; only (company_size_bucket, vertical) and aggregate metrics. No raw org data in the table. |

**Before 061:** Cohorts of size 1 or 2 could be published, making it possible to infer a single org’s metrics.  
**After 061:** Only cohorts with n ≥ 10 are written; small cohorts are omitted from the next refresh.

---

## 2. RLS denies access to raw cross-org tables

| Resource | RLS / access | Status |
|----------|--------------|--------|
| **organizations** | SELECT: `is_platform_admin() OR is_org_member(id, auth.uid())` (051). Org users see only orgs they belong to. | **PASS** — No raw cross-org read for normal users. |
| **sales_proposals, inspections, etc.** | Org-scoped (e.g. `is_org_member(org_id, auth.uid())` or equivalent). | **PASS** — Users see only their org’s data. |
| **benchmark_aggregates** | No `org_id`; anonymized by (company_size_bucket, vertical). SELECT allowed for authenticated; INSERT/UPDATE/DELETE only via service role (cron). | **PASS** — Only pre-aggregated, non-org-specific data is readable. |
| **refresh_benchmark_aggregates()** | SECURITY DEFINER; used by cron with service role. Reads from organizations/sales_proposals/inspections for opted-in orgs only; writes only to `benchmark_aggregates`. | **PASS** — No raw cross-org data returned to callers; aggregation happens in DB. |

**Conclusion:** There is no table that exposes raw cross-org rows to authenticated org users. Cross-org data is used only inside the definer function for aggregation; the only user-visible cross-org data is `benchmark_aggregates`, which is anonymized and cohort-sized (n ≥ 10 after 061).

---

## 3. Opt-out removes org from next refresh

| Check | Status | Notes |
|-------|--------|--------|
| **Opt-out stored per org** | **PASS** | `organizations.benchmarking_opt_in` (default false). When set to false, org is excluded from benchmarking. |
| **Refresh uses only opted-in orgs** | **PASS** | `refresh_benchmark_aggregates()` uses `WHERE benchmarking_opt_in = true` in the `opted` CTE. Only those orgs contribute to aggregates. |
| **Opt-out takes effect on next refresh** | **PASS** | Refresh is TRUNCATE + INSERT from current opted-in set. When an org opts out, the next cron run of `refresh_benchmark_aggregates` does not include it, so its data is no longer in any cohort. No caching of “previous” opted-in set. |

**Flow:** Cron calls `/api/cron/refresh-benchmark-aggregates` → `refresh_benchmark_aggregates()`. The function reads only orgs with `benchmarking_opt_in = true`. Setting `benchmarking_opt_in = false` removes the org from the next run; no extra step required.

---

## Summary

| Audit item | Result |
|------------|--------|
| Minimum cohort size (n ≥ 10) so aggregates cannot be reverse engineered | **FIX APPLIED** — Migration 061. |
| RLS denies access to any raw cross-org table | **PASS** — Org-scoped RLS; only anonymized aggregates exposed. |
| Opt-out removes org from next refresh | **PASS** — Refresh uses `benchmarking_opt_in = true` only. |

---

## Change made this run

- **Migration `061_benchmark_minimum_cohort.sql`:** `refresh_benchmark_aggregates()` now includes `HAVING COUNT(*) >= 10` in the aggregation so only cohorts of at least 10 orgs are written to `benchmark_aggregates`. Smaller cohorts are not published.
