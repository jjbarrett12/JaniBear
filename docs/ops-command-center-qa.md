# Operations Command Center — QA Checklist

## Route & access
- [ ] `/app/ops/command-center` loads for users with `ops.read`.
- [ ] Users without `ops.read` are redirected to `/app/forbidden`.
- [ ] Sales-only users do not see Command Center in nav (unless explicitly granted ops.read later).
- [ ] Action buttons (Assign backup, View risk, etc.) are visible only when user has `ops.write`; otherwise read-only.

## Filters
- [ ] Date selector defaults to today and filters shift coverage to that date.
- [ ] Territory filter narrows coverage gaps, risk accounts, and backup pools to that territory.
- [ ] Vertical filter narrows backup pools (and related data when applicable).
- [ ] Search box filters by account name / operator name (Enter applies).
- [ ] Changing filters updates the page (URL searchParams) and all panels reflect the same filters.

## KPI strip
- [ ] Coverage Gaps Tonight = count of shift_coverage rows with `coverage_status = 'coverage_needed'` for the selected date.
- [ ] High Risk Accounts = count of account_risk_snapshots with risk_level high or critical, status active.
- [ ] Reliability Alerts = count of operators with reliability_score < 65.
- [ ] Backup Capacity Available = sum of “available tonight” across backup pools (qualified, under max shifts).
- [ ] Optional: Avg QC Score, Missed Tasks Today, Complaints (7d) show when data exists.

## Coverage Gaps panel
- [ ] Shows shift_coverage rows for the selected date; statuses: scheduled, coverage_needed, backup_assigned, completed.
- [ ] Rows sorted with coverage_needed first, then by start_time.
- [ ] Status badges: coverage_needed = red/amber, backup_assigned = blue/secondary, completed = muted.
- [ ] “Assign” appears for coverage_needed when user has ops.write; links to Ops dashboard or assign flow.
- [ ] “View” links to account detail where applicable.

## Risk Accounts panel
- [ ] Shows account_risk_snapshots (active); columns: Account, Risk Level, Top Reason, Action.
- [ ] Risk badge colors: critical = red, high = orange, medium = amber, low = muted.
- [ ] Sorted: critical/high first, then by risk_score desc.
- [ ] “View risk” links to `/app/ops/risk/[accountId]`.

## Crew Reliability panel
- [ ] Shows crew_reliability_snapshots when present; otherwise derives from operator_performance (reliability_score = total_score, trend = flat).
- [ ] Columns: Operator, Score, Trend, QC.
- [ ] Low score (< 50) styled red; 50–65 amber; higher muted.
- [ ] Sorted by lowest reliability first.

## Backup Pools panel
- [ ] Shows backup_pools with: name, available tonight (qualified & under max shifts), coverage_health, avg score.
- [ ] Health: healthy = 3+ available, thin = 1–2, critical = 0.
- [ ] Filtering by territory/vertical restricts pools shown.

## Recommended Actions queue
- [ ] Actions are ranked by priority (e.g. uncovered shift tonight highest, then critical risk, backup pool critical, reliability).
- [ ] Coverage gap actions link to assign backup (when canWrite).
- [ ] Risk account actions link to `/app/ops/risk/[accountId]` (use account_id from action).
- [ ] No duplicate or nonsensical actions; list is readable and actionable.

## Data consistency
- [ ] All panels are org-scoped; no cross-org data.
- [ ] Territory/vertical/search filters affect all panels consistently (coverage, risk, pools as designed).
- [ ] Server-side aggregation only; client does not assemble multiple datasets.

## Performance & UX
- [ ] Page loads within a few seconds with typical org data.
- [ ] Sticky header with filters remains visible on scroll.
- [ ] Tables are dense but readable; no excessive whitespace.
- [ ] Navigation: Command Center appears under Operations in sidebar (navCommandCenter).
