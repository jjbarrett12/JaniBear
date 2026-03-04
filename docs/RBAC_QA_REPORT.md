# RBAC Security QA Report

**Date:** 2026-03-04  
**Scope:** Database RLS, API route guards, UI/route protection, invite flows, audit logging.  
**Target:** No unauthorized access, no role escalation, no cross-org leakage; UI gating matches server (server/DB is authority).

---

## Executive Summary

- **RLS**: Enabled on core tenant tables; policies use `is_org_member`, `get_user_org_role`, `can_write_org`, and (later) `has_org_role` / `has_permission`. Role escalation prevented by DB trigger (only owner can assign owner).
- **API**: `/api/orgs/[orgId]/*` routes use `requireOrgPermission(orgId, permission)` or `requireOrgMember(orgId)`; unauthenticated → 401, wrong org → 403. Explicit owner-assignment check added in PATCH member.
- **Critical issues fixed:**
  1. **account_invites** RLS allowed any authenticated user to read all rows (including tokens) → policy dropped; only SECURITY DEFINER RPC reads by token.
  2. **accept_org_invite** and **accept_account_invite** did not bind accept to invite email → any logged-in user could accept someone else’s invite; both RPCs now require current user email to match invite email.
  3. **PATCH /api/orgs/[orgId]/members/[memberId]** with `role: 'owner'` was only blocked by DB trigger → API now returns 403 with a clear message when caller is not owner.
- **Audit**: `audit_log` exists and is scoped by org; only owner/admin/manager can read (RLS). Current app logging covers pricing, proposals, contracts, inspections, invoices, account updates, deal_won. **Gap:** invite create/revoke/resend, role changes, and deactivations are not yet written to audit_log (recommended for future work).
- **Sidebar**: System/Admin links are visible to all roles; server-side guards prevent access. Optional improvement: filter nav by permission so crew/cleaner do not see admin links.

---

## A) Database / RLS Verification

### Tables and RLS

- **002_rls_policies.sql**: RLS enabled on organizations, profiles, org_members, locations, location_areas, service_contracts, bids, supply_usage, crews, crew_members, crew_assignments, templates, template_sections, template_items, schedules, task_assignments, task_completions, inspections, inspection_* , issues, issue_* , report_shares.
- **Helpers:** `is_org_member(org_id, user_id)`, `get_user_org_role(org_id, user_id)`, `can_write_org(org_id, user_id)` (owner/manager/inspector can write).
- **051**: organizations INSERT restricted to platform or `create_org_for_signup`; org_members INSERT/UPDATE/DELETE require platform or `has_org_role(org_id, ['owner','admin'])`. org_invites: only platform or owner/admin for that org.
- **090**: `has_permission(org_id, permission_key)`; `role_permissions` seeds owner/admin/manager/...; trigger on org_members and org_invites: only owner can set role = 'owner'.
- **084**: audit_log RLS — SELECT for org members with role in (owner, admin, manager); INSERT for any org member in that org.

### Simulated behaviour (by role)

- **Owner:** Can read/update org; manage org_members and org_invites for own org; assign owner (trigger allows).
- **Admin:** Same as owner for own org; cannot assign owner (trigger raises).
- **Manager:** Can read org and org-scoped data; cannot manage org_members/org_invites (RLS denies).
- **Crew/cleaner:** Can read crews, schedules, task_assignments, inspections per policies; cannot write org_members; cannot read management-only tables (e.g. employees, invoices) except where policy allows.
- **ClientViewer:** role_permissions limits to reports.view; no ops/sales/management permissions.
- **Cross-org:** All policies key off `org_id` and `is_org_member(org_id, auth.uid())` (or equivalent); user in org A sees no rows for org B.

### Issue and fix (A8)

- **account_invites:** Policy "Authenticated can read account_invites" allowed any authenticated user to SELECT all rows → **fixed in 091** by dropping this policy. Only `accept_account_invite` (SECURITY DEFINER) reads by token; no listing from client.

---

## B) API Route Testing

### Routes audited

| Route | Auth | Permission / check | Cross-org |
|-------|------|--------------------|-----------|
| GET/POST /api/orgs | requireApiAuth (create) | N/A | N/A |
| GET /api/orgs/[orgId]/onboarding | requireOrgMember(orgId) | — | 403 if not member |
| PATCH /api/orgs/[orgId]/onboarding | requireOrgPermission(orgId, manage_settings) | — | 403 if not member |
| GET /api/orgs/[orgId]/members | requireOrgPermission(orgId, manage_users) | — | 403 if not member |
| PATCH/DELETE /api/orgs/[orgId]/members/[memberId] | requireOrgPermission(orgId, manage_users) | Owner-assignment check added | 403 if not member |
| GET/POST /api/orgs/[orgId]/invites | requireOrgPermission(orgId, manage_users) | — | 403 if not member |
| DELETE /api/orgs/[orgId]/invites/[inviteId] | requireOrgPermission(orgId, manage_users) | — | 403 if not member |
| POST resend | requireOrgPermission(orgId, manage_users) | — | 403 if not member |
| GET /api/orgs/[orgId]/audit | requireOrgPermission(orgId, manage_users) | — | 403 if not member |

- **Unauthenticated:** requireApiAuth → 401.
- **Authenticated, not in org:** requireOrgMember(orgId) → 403.
- **In org, no permission:** requireOrgPermission → 403.
- **Assign owner as non-owner:** PATCH with role 'owner' → 403 "Only an owner can assign the owner role" (and DB trigger as backup).

---

## C) UI / Route Guards

- **/app/admin** (and children): `requireOrg()` then role check `['owner','admin','manager']`; else redirect to `/app/dashboard`. Crew/cleaner cannot access.
- **Server-side:** Layout and pages use `requireOrg()`; admin page additionally checks role; no data fetched for unauthorized users before redirect.
- **Sidebar:** Built from `navFactory` + `shellNav`; System section (Admin, Users, Invites, Audit, etc.) is shown to all roles. **Finding:** Links are visible to crew; clicking leads to redirect. Optional: filter System section by `has_permission` or role so only users with manage_users see those links.

---

## D) Invite Flow Hardening

### Org invites (org_invites)

- **Expiry:** accept_org_invite checks `expires_at < NOW()` → error.
- **Reuse:** accept_org_invite sets `accepted_at`; second accept sees accepted_at IS NOT NULL → error.
- **Bound to org_id:** Insert uses invite row’s org_id; no cross-org.
- **Email binding (fixed in 091):** Previously any authenticated user could accept any org invite. Now: current user’s email (from auth.users) must match invite email (case-insensitive trim); else error.

### Account invites (account_invites)

- **Expiry / reuse:** accept_account_invite checks expires_at and accepted_at; same behaviour.
- **Bound to account_id / org:** RPC uses invite row; adds user to that account and org.
- **Email binding (fixed in 091):** Same as org invites; current user email must match invite email.
- **RLS (fixed in 091):** Broad SELECT removed; only RPC reads by token.

### Resend / revoke

- Resend extends expiry and returns new link; old token remains single-use once accepted.
- Revoke (DELETE invite) removes row; accept with that token fails (invalid or expired).

---

## E) Logging / Audit

- **audit_log table (084):** org_id, actor_user_id, action, entity_type, entity_id, before_state, after_state. RLS: SELECT for owner/admin/manager of that org; INSERT for org members.
- **Current usage:** logAudit() used for pricing_change, proposal_edit, contract_frequency_change, inspection_score_change, invoice_edit, account_update, invoice_create, deal_won. Sensitive keys (password, token, etc.) stripped.
- **Gaps (recommendations):** Log invite_created, invite_revoked, invite_resend; member_role_changed, member_deactivated, member_removed; org_settings / module changes. Not implemented in this audit; add in API routes or server actions when modifying those entities.

---

## F) Deliverables

1. **QA checklist:** `docs/rbac-qa.md` — step-by-step pass/fail checklist for RLS, API, UI, invites, audit, plus security assertions and bug/fix table.
2. **Code/migration:**
   - **091_rbac_invite_email_binding_and_account_invites_rls.sql:** Drop account_invites broad SELECT; add email check to accept_org_invite and accept_account_invite.
   - **PATCH /api/orgs/[orgId]/members/[memberId]:** Explicit 403 when non-owner tries to set role to 'owner'.

---

## Security Assertions (must remain true)

1. **RLS on all tenant tables** — No table that holds org-scoped or user-scoped data is without RLS and appropriate policies.
2. **Org isolation** — Every policy and API that touches tenant data is scoped by org_id; membership is checked via is_org_member / has_org_role / requireOrgMember.
3. **Owner assignment** — Only an existing owner can set role = 'owner' (DB trigger + API check).
4. **Invite integrity** — Invite tokens are single-use, have expiry, and (after 091) are bound to the invitee’s email; account_invites is not readable by arbitrary authenticated users.
5. **API authority** — All /api/orgs/[orgId] routes validate session, org membership, and (where needed) permission; 401/403 before any sensitive response.
6. **No escalation** — Admins and managers cannot become owners through the app or API; triggers and API enforce this.
7. **Audit scope** — audit_log is only readable by owner/admin/manager for that org; inserts are limited to the actor’s org.

---

## How to Apply

1. Run migration **091** in Supabase (SQL editor or migration runner).
2. Deploy the updated PATCH members route.
3. Re-run the checklist in `docs/rbac-qa.md` for regression.
4. (Optional) Add audit events for invites and role changes; (optional) filter sidebar admin links by permission.
