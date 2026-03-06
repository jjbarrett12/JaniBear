# Account at Risk — QA Checklist

- [ ] **Migration** Run `104_account_risk_engine.sql`; verify `account_risk_snapshots`, `account_risk_events`, `account_interventions`, `risk_settings` exist; alerts type includes `account_at_risk`.
- [ ] **Risk snapshot** Nightly (or POST `/api/internal/risk/run`) creates/updates snapshots; risk_score 0–100 and risk_level (low/medium/high/critical) set.
- [ ] **Risk level change** When snapshot transitions to worse level or score jumps ≥15, `account_risk_events` row with action `risk_detected` and an `alerts` row (type `account_at_risk`) are created.
- [ ] **Banner** On account detail, when snapshot exists with risk_level high/critical and status active, "Account at Risk" banner appears with View risk / Assign backup / Create intervention.
- [ ] **Recommended backups** Snapshot `recommended_backups` has top 3; each has operator_type, operator_id, score, rationale; backups are eligible (capacity > 20, performance ≥ 70, same territory when required).
- [ ] **Assign backup** POST `/api/app/risk/accounts/[accountId]/assign-backup` logs `backup_assigned` event; does not remove current operator (MVP backup/assist).
- [ ] **Acknowledge / Dismiss** Snapshot status updates to acknowledged or dismissed; event logged.
- [ ] **Intervention** POST intervention creates `account_interventions` row with default checklist and logs `intervention_created`.
- [ ] **Ops map Risk layer** Toggle "Risk" in Ops mode colors facility pins by account risk level (low=green, medium=yellow, high=amber, critical=red); heatmap uses account_risk_snapshots.risk_score when available.
- [ ] **RLS** Org A cannot see org B risk snapshots, events, or interventions; ops.read/ops.write enforced on app APIs.
