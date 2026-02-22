# Alerts: Anti-Spam, RLS, Performance — Validation

**Date:** 2025-02-20  
**Scope:** Alert generation rules (no spamming), RLS (org isolation), indexes (entity_id/type, created_at).

---

## 1. Alert generation rules not spamming

| Check | Status | Notes |
|-------|--------|--------|
| **One open alert per entity** | **FIX APPLIED** | Migration `064_alerts_anti_spam_and_indexes.sql` adds unique partial index `idx_alerts_one_open_per_entity` on `(org_id, entity_type, entity_id)` WHERE `status = 'open' AND entity_id IS NOT NULL`. Duplicate open alerts for the same entity are rejected at the DB level. |
| **Generation logic** | **N/A** | No alert generation job or cron exists yet; the `alerts` table is ready for future use. When adding generation: use `INSERT ... ON CONFLICT DO NOTHING` (or conflict on a synthetic key), or `SELECT` for existing open alert by `(org_id, entity_type, entity_id)` and skip insert if found. |

**Rule for future implementers:** Before inserting an alert, either (a) rely on the unique index and catch conflict (skip or update), or (b) query for an existing open alert with the same `(org_id, entity_type, entity_id)` and only insert if none. Avoid creating a new row on every evaluation run (e.g. cron) without deduplication.

---

## 2. Correct RLS (org isolation)

| Policy | Definition | Status |
|--------|------------|--------|
| **SELECT** | `org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())` | **PASS** — Users see only alerts for orgs they belong to. |
| **INSERT** | `WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()))` | **PASS** — Users can only create alerts for their orgs. |
| **UPDATE** | `USING` and `WITH CHECK` same org membership | **PASS** — Users can only update alerts in their orgs. |
| **DELETE** | `USING (org_id IN (... org_members ...))` | **PASS** — Users can only delete alerts in their orgs. |

**Conclusion:** Full org isolation; no cross-org access to `public.alerts`.

---

## 3. Performance: indexes for entity_id/type, created_at

| Index | Definition | Purpose |
|-------|------------|--------|
| **idx_alerts_entity** | `(org_id, entity_type, entity_id)` | Lookup by entity; dedup check; list alerts for one entity. |
| **idx_alerts_org_created** | `(org_id, created_at DESC)` | Time-ordered lists per org; "recent alerts" and pagination. |
| **idx_alerts_org_status** | `(org_id, status)` | Filter by open/assigned/dismissed. |
| **idx_alerts_type** | `(org_id, type)` | Filter by alert type. |
| **idx_alerts_one_open_per_entity** | `(org_id, entity_type, entity_id)` WHERE `status = 'open' AND entity_id IS NOT NULL` | Enforces one open alert per entity; also supports "existing open for entity?" lookups. |

**Conclusion:** entity_id/entity_type and created_at are covered. No additional indexes required for the stated use cases.

---

## Summary

| Item | Result |
|------|--------|
| Alert generation not spamming | **PASS** — Unique partial index enforces one open alert per entity (when entity_id is set). |
| RLS org isolation | **PASS** — All operations scoped by org membership. |
| Indexes for entity_id/type, created_at | **PASS** — idx_alerts_entity, idx_alerts_org_created (and others) in place. |

---

## Change made this run

- **Migration `064_alerts_anti_spam_and_indexes.sql`:** Adds `idx_alerts_one_open_per_entity` so duplicate open alerts per `(org_id, entity_type, entity_id)` are rejected and generation logic can rely on the DB to avoid spam.
