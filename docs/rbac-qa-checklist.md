# RBAC & Onboarding — Manual QA Checklist

Use this checklist to verify RBAC and onboarding flows after deployment or schema changes.

## Database

- [ ] Migration `090_rbac_permissions_and_onboarding.sql` applied: tables `role_permissions`, `org_settings` exist; `has_permission(org_id, permission_key)` works.
- [ ] New organizations get a row in `org_settings` (trigger) with `onboarding_status = 'pending'`.
- [ ] Only an owner can assign the `owner` role (trigger on `org_members` and `org_invites` blocks non-owners).

## Auth & API

- [ ] **POST /api/orgs** — Creates org (current user becomes owner). Requires auth. Body: `{ "name": "Org Name" }`.
- [ ] **GET /api/orgs/[orgId]/members** — Returns members only with `org.manage_users`. 403 if no permission.
- [ ] **PATCH /api/orgs/[orgId]/members/[memberId]** — Update role/status. 403 without `org.manage_users`. Cannot set role to owner unless caller is owner (DB trigger).
- [ ] **DELETE /api/orgs/[orgId]/members/[memberId]** — Remove member. Cannot remove last owner.
- [ ] **GET/POST /api/orgs/[orgId]/invites** — List/create invites. Requires `org.manage_users`.
- [ ] **DELETE /api/orgs/[orgId]/invites/[inviteId]** — Revoke invite.
- [ ] **POST /api/orgs/[orgId]/invites/[inviteId]/resend** — Resend (extends expiry, returns new link).
- [ ] **GET /api/orgs/[orgId]/audit** — List audit log. Requires `org.manage_users`.
- [ ] **GET/PATCH /api/orgs/[orgId]/onboarding** — Read/update onboarding state. PATCH requires `org.manage_settings`.

## Admin UI (/app/admin/team)

- [ ] Only users with `org.manage_users` can open the page (others redirect to dashboard).
- [ ] **Users tab:** List members, change role via dropdown, deactivate/reactivate, remove (except last owner).
- [ ] **Invites tab:** Send invite (email + role), see pending invites, resend, revoke.
- [ ] **Roles & permissions tab:** Read-only list of roles and permission keys; sensitive permissions highlighted.
- [ ] **Audit log tab:** List of audit entries (if any).

## Invite flow

- [ ] Create invite from Admin → Team & access → Invites (or Settings → Team). Copy link.
- [ ] Open link in incognito or another browser; sign in or sign up with the invited email.
- [ ] After accepting, user is added to org with the invited role and redirected to dashboard.

## Onboarding

- [ ] New org (after migration) has `org_settings.onboarding_status = 'pending'`.
- [ ] User with pending onboarding is redirected to `/app/onboarding` when visiting any other /app route.
- [ ] Onboarding wizard: steps Welcome → Role template → Invite → Modules → Finish. Finish sets status to `completed` and redirects to dashboard.
- [ ] After completion, user can access full app; no more redirect to onboarding.

## Security

- [ ] Non-member cannot access another org’s data via API (use different orgId in path).
- [ ] Manager/sales/ops cannot open /app/admin/team (redirect).
- [ ] Admin cannot assign owner role (API or DB trigger returns error).
