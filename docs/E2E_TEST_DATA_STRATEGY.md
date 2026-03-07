# JANIBEAR E2E Test Data Strategy

Mission-critical E2E tests rely on deterministic seed data and stable selectors. This doc covers test data, seed/setup, selector conventions, and **production-critical coverage** by flow.

## Mission-critical E2E coverage (by flow)

| Flow | File | What is covered | Pass/fail assertion |
|------|------|-----------------|----------------------|
| **1. Tenant isolation** | `e2e/tenant-isolation.e2e.ts` | User from org A cannot access org B records (API 403, org list excludes B) | `res.status() === 403`, `ownIds` does not contain `otherOrgId` |
| **2. Role access** | `e2e/role-access.e2e.ts` | Cub → upgrade on ops; Grizzly → no forbidden admin; Client Viewer → read-only; Crew → no Sales | URL or upgrade/forbidden/denied content visible |
| **3. Sales flow** | `e2e/sales-flow.e2e.ts` | Leads, Walkthroughs, Proposals, Pipeline, Launch packets reachable; convert → opportunity path | URL + heading/list or empty state visible |
| **4. Launch flow** | `e2e/launch-flow.e2e.ts` | Launch packets page + ops launch-intake; converted deal creates launch packet (via sales convert) | Launch packet list or empty; ops launch-intake or upgrade |
| **5. Operations flow** | `e2e/operations-flow.e2e.ts` | Crews, Schedules, Accounts (and service deployments) load when ops enabled | URL + ops content or upgrade screen |
| **6. Inspection flow** | `e2e/inspection-flow.e2e.ts` | Inspections list, New Inspection, start page; complete inspection records QC score | Headings/buttons visible; run page has Complete |
| **7. Billing safety** | `e2e/billing-safety.e2e.ts` | Webhook without/invalid signature → 400; duplicate event id → idempotent (200 both, no double-process) | status 400; second POST 200 when first 200 |
| **8. Auth flow** | `e2e/auth-flow.e2e.ts`, `e2e/forbidden-no-flash.e2e.ts` | Unauthenticated → redirect to login; authenticated → app content; no /app/forbidden flash for authorized nav | URL matches login or /app/; forbidden never in URL during nav |

## 1. Test data strategy

### 1.1 Two-org, multi-role seed

Run **`npm run seed:test`** (or `npx tsx scripts/seedTestOrg.ts`) to create:

| Org        | Users (email / role)                                                                 | Purpose                                      |
|-----------|--------------------------------------------------------------------------------------|----------------------------------------------|
| **Alpha Org** | owner@janibear.test (org.owner), admin@janibear.test (org.admin), salesmanager@janibear.test, salesrep@janibear.test, opsmanager@janibear.test, crewlead@janibear.test, crew@janibear.test, **client@janibear.test (client.viewer)** | Tenant A; RBAC and role-access tests.        |
| **Bravo Org** | bravo@janibear.test (org.owner)                                                      | Tenant B; tenant-isolation tests (user from A must not see B). |

- **Password for all**: `Password123!`
- **Output**: `.e2e-ids.json` with `alphaOrgId` and `bravoOrgId` (used by tenant-isolation and cross-tenant tests).

### 1.2 Plan / entitlements (Cub vs Grizzly/Kodiak)

- **Cub**: `organizations.plan` = `cub` or `free`. Operations (`/app/ops/*`), Launch to Ops, and some premium features show **upgrade screen**.
- **Grizzly/Kodiak**: `organizations.plan` = `grizzly` or `kodiak`. Full access to ops, launch packets, inspections, etc.
- **Platform admin**: User in `platform_admins` (or equivalent) bypasses plan checks (treated as Kodiak).

For E2E:

- **Role access (Cub)**: Use Alpha Org with `plan = cub` (or leave default). Assert `/app/ops` shows upgrade screen (e.g. “Grizzly” / “Operations” upgrade).
- **Ops / launch / inspection flows**: Either:
  - Seed Alpha with `plan = grizzly` for those runs, or
  - Use API/entitlement mocks so that ops routes render (see upgrade-paywall pattern).

Optional: extend `scripts/seedTestOrg.ts` to accept `E2E_ALPHA_PLAN=grizzly` and set `organizations.plan` for Alpha.

### 1.3 Client Viewer (read-only)

- **client@janibear.test** has role `client.viewer`.
- Assert: can open dashboard/read views; cannot see “Invite”, “Settings”, “Admin”, or other write actions; write APIs return 403.

### 1.4 Sales / launch test data

- **Leads, walkthroughs, proposals**: Create via UI in E2E (lead → walkthrough → proposal) or seed 1–2 leads per org for “convert → opportunity → launch packet” tests.
- Optional seed: one **lead** in Alpha with `status = 'qualified'` and optional **proposal** for convert + launch packet visibility tests.

## 2. Seed/setup order (run before E2E)

1. **Database + env**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.
2. **Seed**: From repo root run **`npm run seed:test`** (or `npx tsx scripts/seedTestOrg.ts`). This creates Alpha Org, Bravo Org, and all test users; writes `.e2e-ids.json` with `alphaOrgId` and `bravoOrgId`.
3. **Credentials**: Set `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD` (e.g. `owner@janibear.test` / `Password123!`). For role-specific tests, use the same password with the appropriate user (see `e2e/helpers/selectors.ts` — `TEST_USERS`).
4. **Optional**: `E2E_OTHER_ORG_ID` or rely on `.e2e-ids.json` `bravoOrgId` for tenant-isolation. `E2E_STRIPE_WEBHOOK_SECRET` for billing idempotency test.

Re-running `seed:test` is idempotent and safe.

## 3. Environment variables

| Variable              | Required | Description |
|-----------------------|----------|-------------|
| `E2E_LOGIN_EMAIL`     | Yes*     | Default login for most tests (e.g. owner@janibear.test or salesrep@janibear.test). |
| `E2E_LOGIN_PASSWORD` | Yes*     | Password (e.g. `Password123!`). |
| `E2E_OTHER_ORG_ID`    | No       | UUID of an org the login user is **not** in; if unset, tenant-isolation uses a placeholder UUID (403 still expected). |
| `E2E_IDS_PATH`        | No       | Path to `.e2e-ids.json` (default: `.e2e-ids.json`). |
| `E2E_AUTHZ_SIMULATE_FAIL` | No   | Set to `1` to run authz-error simulation test. |
| `E2E_STRIPE_WEBHOOK_SECRET` | No | Test webhook secret for billing idempotency E2E (signed duplicate event). |

\* For role-specific tests, use the appropriate seeded user (e.g. client@janibear.test, crew@janibear.test) and set `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` for that run, or add dedicated env vars (e.g. `E2E_CLIENT_VIEWER_EMAIL`) in the future.

## 4. Stable selectors

Prefer in order:

1. **Role + accessible name**: `page.getByRole('button', { name: /sign in/i })`, `page.getByRole('link', { name: /Dashboard/i })`.
2. **Label**: `page.getByLabel(/email/i)`, `page.getByLabel(/password/i)` for login.
3. **Text**: `page.getByText(/Launch to Operations/i)` when no role/label is stable.
4. **Test IDs** (if added): `data-testid="launch-packet-list"` for lists/tables.

Avoid:

- Bare CSS classes or DOM structure that may change.
- Index-based selectors (e.g. “second button”) unless unavoidable.

### 3.1 Login pattern

Used across E2E files:

```ts
await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
await page.getByLabel(/email/i).fill(E2E_EMAIL);
await page.getByLabel(/password/i).fill(E2E_PASSWORD);
await page.getByRole('button', { name: /sign in/i }).click();
await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });
```

### 3.2 Key pages / assertions

- **Dashboard**: URL `/app/dashboard` or `/app/...`; link with name “Dashboard”.
- **Ops (Cub)**: `/app/ops` → upgrade screen with “Grizzly” or “Operations”.
- **Sales leads**: `/app/sales/leads`; “Leads” or “Add lead” / “New lead”.
- **Launch packets**: `/app/sales/launch-packets`; “Launch to Operations” or “Launch packets”.
- **Inspections**: `/app/inspections`; “New Inspection” or “Inspections”.
- **Forbidden**: `/app/forbidden` or `/app/authz-error` for permission denial.
- **Authz error**: “couldn't verify access”, “Retry”, “Back to Dashboard”.

Centralized in **`e2e/helpers/selectors.ts`**: `SELECTORS` (login, nav, forbidden, authzError, sales, ops, inspections, denied) and **`TEST_USERS`** (owner, admin, salesManager, salesRep, opsManager, crewLead, crew, clientViewer, bravo). Use `loginWithPassword` and `getDefaultLogin` from `e2e/helpers`.

## 5. Flakiness reduction

- Use `waitUntil: 'domcontentloaded'` or `networkidle` consistently; avoid arbitrary `page.waitForTimeout`.
- After login, wait for URL: `expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 })`.
- For nav: click then `waitForLoadState('networkidle')` or wait for a stable element (e.g. heading).
- Run with `workers: 1` in CI if tests share state (e.g. same DB); `playwright.config.ts` already sets `workers: process.env.CI ? 1 : undefined`.
- Seed is idempotent; re-running `seed:test` is safe.

## 6. Running E2E

```bash
# 1. Seed (from repo root)
npm run seed:test

# 2. Set credentials (or use .env.e2e)
export E2E_LOGIN_EMAIL=owner@janibear.test
export E2E_LOGIN_PASSWORD=Password123!

# 3. Run all E2E
npm run test:e2e

# 4. Run a subset
npx playwright test e2e/tenant-isolation
npx playwright test e2e/role-access
npx playwright test e2e/sales-flow
```

## 7. Billing / webhook idempotency

- **Stripe webhook** idempotency (duplicate event id not double-processed): requires a valid signed payload. E2E can either:
  - Use a **test webhook secret** and send the same event twice, then assert 200 both times and no duplicate rows (e.g. `org_billing_events`), or
  - Rely on **integration/unit tests** that mock Stripe and assert handler is idempotent.
- If you add a **test-only** endpoint that accepts a pre-built event payload and processes it (e.g. in test env only), E2E can POST twice and assert no double side effects.
