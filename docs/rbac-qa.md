# RBAC QA Regression Checklist

Use this checklist to verify the RBAC system remains secure after any auth, permission, or invite change. **Server/DB is the authority;** UI and API must align.

---

## A) Database / RLS

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| A1 | RLS enabled on all tenant tables (organizations, org_members, org_invites, accounts, account_invites, audit_log, etc.) | | `SELECT tablename FROM pg_tables WHERE schemaname='public'` then `SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace` |
| A2 | As **owner**: can SELECT/UPDATE org and org_members for own org; cannot see other org_id | | Use Supabase SQL editor as role or `SET request.jwt.claim.sub = '<owner_user_id>'` (if supported) |
| A3 | As **admin**: same as owner for own org; cannot assign role = 'owner' (trigger blocks) | | |
| A4 | As **manager**: can read org data; cannot INSERT/UPDATE/DELETE org_members | | |
| A5 | As **crew/cleaner**: can read crews, schedules, tasks; cannot SELECT from employees, invoices, org_members (beyond own row) per policy | | |
| A6 | **ClientViewer**: can only read reports / account-scoped data per role_permissions; cannot access ops/sales/management tables | | |
| A7 | **Cross-org**: user in org A cannot SELECT rows where org_id = org B | | |
| A8 | **account_invites**: no policy allows broad SELECT; only SECURITY DEFINER RPC reads by token | | After 091 |
| A9 | **org_invites**: only owner/admin can SELECT/INSERT/UPDATE/DELETE for their org_id | | has_org_role(org_id, ['owner','admin']) |

---

## B) API Routes (/api/orgs/[orgId]/*)

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| B1 | **Unauthenticated**: GET/POST/PATCH/DELETE any /api/orgs/[orgId]/... → **401** | | Omit cookie or use invalid token |
| B2 | **Authenticated, not member of orgId**: same → **403** (no 404 with body leak) | | Use user in org A, call with orgId = org B |
| B3 | **Member without permission**: e.g. GET /api/orgs/[orgId]/audit as crew → **403** | | org.manage_users required |
| B4 | **Permitted role**: GET /api/orgs/[orgId]/members as owner → **200**, data only for that orgId | | |
| B5 | **PATCH member role to owner as admin** → **403** (API) or **400** (DB trigger) | | Only owner can assign owner |
| B6 | **Assign role higher than self**: admin tries to set member to owner → **403** or trigger error | | |
| B7 | **Access other orgId**: logged into org A, call with orgId = B → **403** | | requireOrgMember checks membership |

---

## C) UI / Route Guards

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| C1 | **/app/admin** as Crew → redirected to /app/dashboard (server guard) | | |
| C2 | **/app/admin/users**, **/app/admin/invites**, **/app/admin/audit** as Crew → blocked | | |
| C3 | **Sidebar**: Admin/Users/Invites/Audit visible only when user has org.manage_users (or hide for crew) | | Currently all see System section; server blocks; optional: filter nav by permission |
| C4 | **Direct URL** to /app/admin/team as manager → allowed if has permission; as crew → redirect | | |
| C5 | **Server-side**: requireOrg() and role check run before render; no data fetched for unauthorized | | |

---

## D) Invite Flows

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| D1 | **Expired token**: accept_org_invite / accept_account_invite with expired token → error, no row change | | |
| D2 | **Token reuse**: accept same token twice → second call error "already been used" | | accepted_at set on first accept |
| D3 | **Token bound to org_id**: invite for org A cannot add user to org B | | RPC uses org_id from invite row |
| D4 | **Email binding**: logged-in user alice@x.com cannot accept invite for bob@y.com → error | | After 091 migration |
| D5 | **Resend**: extends expiry / new link; old token still invalid after use | | |
| D6 | **Revoke**: DELETE invite invalidates token; accept after revoke fails | | |

---

## E) Audit / Logging

| # | Step | Pass/Fail | Notes |
|---|------|-----------|--------|
| E1 | **audit_log** RLS: only owner/admin/manager can SELECT; insert allowed for org members | | 084 |
| E2 | **Audit rows scoped by org_id**: list only returns rows for request orgId | | API filters .eq('org_id', orgId) |
| E3 | **Recommended**: log invite created, revoked, resend; role change; member deactivated/removed; module change | | Currently pricing, proposal, contract, inspection, invoice, account_update, deal_won only |

---

## F) Security Assertions (must remain true)

- **No unauthorized access**: Every tenant table has RLS; every /api/orgs/[orgId] route checks auth + org membership + permission where required.
- **No role escalation**: Only owner can assign owner (DB trigger + API check). Admin cannot promote to owner.
- **No cross-org leakage**: Queries and API always scoped by org_id from context or route param; route param orgId validated against membership.
- **Invite integrity**: Tokens single-use, expiry enforced, email-bound (after 091). account_invites not broadly readable.
- **UI mirrors server**: Server/DB is authority; UI can hide links but must not be sole gate. Visiting protected URL without permission returns redirect or 403.

---

## Bugs Found (this audit) and Fixes

| Bug | Severity | Reproduction | Fix |
|-----|----------|--------------|-----|
| account_invites RLS allowed any authenticated user to SELECT all rows (token leakage) | **High** | As any user, `SELECT * FROM account_invites` | Migration 091: drop policy "Authenticated can read account_invites" |
| accept_org_invite did not check email: any user could accept any org invite | **High** | Log in as alice, use invite link for bob@y.com | Migration 091: add email match in accept_org_invite |
| accept_account_invite did not check email: same | **High** | Log in as alice, use account invite link for bob@y.com | Migration 091: add email match in accept_account_invite |
| PATCH member to owner: only DB trigger blocked; API could return generic 400 | **Medium** | Admin PATCH role=owner → DB error | API now returns 403 "Only an owner can assign the owner role" before DB call |
| Sidebar shows Admin/Users/Invites to all roles; server blocks but UX confusing | **Low** | Log in as crew, see System section with admin links | Optional: filter nav by has_permission / role in shellNav |

---

## Running the Checklist

1. **RLS**: In Supabase SQL editor, run as different users (e.g. via service role with `SET LOCAL` or by creating test users and using anon key with their JWT).
2. **API**: Use curl or Postman: no cookie → 401; wrong org → 403; correct org + permission → 200.
3. **UI**: Log in as crew/cleaner, open /app/admin → expect redirect; as owner, open /app/admin → expect page.
4. **Invites**: Create invite for user A, log in as user B, try to accept same link → expect error after 091.

Apply migration **091_rbac_invite_email_binding_and_account_invites_rls.sql** before marking D4 and A8 as Pass.
