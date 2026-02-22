# Logs Verification

Verification that logs are server-only (no client spoofing), do not store sensitive fields, and RLS correctly gates access.

---

## 1. Logs created only server-side (no client spoofing)

### Audit log (`audit_log`)

- **Writer:** `src/lib/audit-log.ts` — server-only module (uses `createClient` from `@/lib/supabase/server`). `logAudit()` is only called from:
  - `src/actions/accounts.ts` (server action)
  - `src/actions/invoices.ts` (server action)
- **No client-callable API** accepts arbitrary audit payloads. All writes go through server actions that build the payload from server-fetched data (e.g. `before`/`after` from DB).
- **RLS:** INSERT allowed for any org member; the row is written with `org_id` from the server context (`requireOrg()`), so a client cannot spoof another org.

### Activity log (`activity_log`)

- **Writer:** `src/lib/activity-logger.ts` — uses `createClient()` from `@/lib/supabase/server` (server-only). `logActivity()` / `createNotification()` are only called from:
  - `src/lib/contract-renewals.ts`
  - `src/lib/work-orders.ts`
  - `src/lib/workflow-engine.ts`
- No client component or public API accepts arbitrary activity/notification payloads.
- **RLS:** After migration **065**, org members can INSERT only for their org (`org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())`). Server actions run as the authenticated user, so inserts are still server-originated.

### Platform audit log (`platform_audit_log`)

- **RLS (051):** `FOR ALL` with `USING (is_platform_admin())` and `WITH CHECK (is_platform_admin())` — only platform admins. Writes are from server-side code only.

**Conclusion:** All log writes are from server-side code; there is no client-spoofable path to create audit or activity entries.

---

## 2. No sensitive fields stored (tokens, secrets)

### Audit log `before_state` / `after_state`

- **Sanitization:** `src/lib/audit-log.ts` runs `sanitizeState()` on both `beforeState` and `afterState` before insert. Keys matching the pattern below are **omitted** (never written):
  - `password`, `token`, `secret`, `api_key`, `refresh_token`, `access_token`, `auth_token`, `private_key`, `credential`, `bearer` (case-insensitive).
- **Current callers:** `accounts` and `invoices` tables have no such columns (see migrations 037, 007). Sanitization future-proofs if new entities or columns are added.

### Activity log `details`

- **Freeform JSONB.** Callers (`work-orders.ts`, `workflow-engine.ts`, `contract-renewals.ts`) pass fixed shapes (e.g. status, IDs). No passwords or tokens are passed. **Guideline:** Do not put secrets in `details`; if needed, add a denylist in `activity-logger.ts` later.

### Notifications

- Only `org_id`, `user_id`, `type`, `title`, `message`, `link` — no sensitive payload.

**Conclusion:** Audit state is sanitized; current usage does not store tokens or secrets. Activity `details` are caller-controlled and currently safe; avoid putting secrets there.

---

## 3. RLS blocks non-admin roles where required

| Table                 | SELECT                                      | INSERT                         | UPDATE / DELETE   |
|-----------------------|---------------------------------------------|--------------------------------|-------------------|
| **audit_log**         | Admin only (owner, admin, manager) — 064    | Org member (same org) — 064    | No policy (append-only) |
| **activity_log**      | Org member (any role) — 006                 | Org member — 065               | No policy         |
| **platform_audit_log**| Platform admin only — 051                   | Platform admin only — 051      | Same              |

- **audit_log:** App layer doubles the gate: `listAuditLog` / `getAuditLogEntry` / `listAuditLogActors` in `src/actions/audit-log.ts` call `requireOrg()` and check `ADMIN_ROLES` before querying. So only owner/admin/manager can view audit log even if they could hit the DB.
- **activity_log:** Read is org-scoped (all org members). Not admin-only by design (activity feed for the org). Write is now allowed for org members via 065 so server actions can insert.
- **platform_audit_log:** RLS alone restricts all operations to `is_platform_admin()`.

**Conclusion:** RLS and app checks ensure non-admins cannot read audit log; platform audit is platform-admin only; activity log is org-scoped and writable only by org members from server code.

---

## Summary

| Requirement                         | Status |
|-------------------------------------|--------|
| Logs created only server-side       | Yes — no client-exposed write API; all writers are server-only. |
| No sensitive fields (tokens, secrets)| Yes — audit state sanitized; no secrets in current activity/notification payloads. |
| RLS blocks non-admin where required | Yes — audit_log read admin-only; platform_audit_log platform-admin only; activity_log org-scoped. |

**Migrations to apply:** **065_activity_log_insert_policy.sql** (so server-side activity_log inserts succeed under RLS).
