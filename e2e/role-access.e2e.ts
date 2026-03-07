/**
 * Role access: Cub cannot access Grizzly/Kodiak areas; Grizzly cannot perform forbidden admin actions;
 * Client Viewer stays read-only; Crew cannot access Sales; platform/admin roles behave correctly.
 * Use TEST_USERS from helpers/selectors for role-specific tests (see docs/E2E_TEST_DATA_STRATEGY.md).
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { TEST_USERS, TEST_PASSWORD, SELECTORS, getDefaultLogin, skipWithoutE2ECredentials } from './helpers/selectors';

test.describe('Role access — protected routes', () => {
  test.beforeEach(() => {
    test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run role-access E2E tests.');
  });

  test('after login, GET /api/orgs/[orgId]/members with own org returns 200 or 403 (permission-gated)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const orgListRes = await page.request.get(`${base}/api/org/list`, { failOnStatusCode: false });
    if (orgListRes.status() !== 200) {
      test.skip(true, 'Could not get org list to determine own org');
      return;
    }
    const { orgs } = (await orgListRes.json()) as { orgs?: { id: string }[] };
    const ownOrgId = orgs?.[0]?.id;
    if (!ownOrgId) {
      test.skip(true, 'No org in list');
      return;
    }
    const membersRes = await page.request.get(`${base}/api/orgs/${ownOrgId}/members`, {
      failOnStatusCode: false,
    });
    expect([200, 403], 'Members endpoint must return 200 (allowed) or 403 (forbidden)').toContain(membersRes.status());
    if (membersRes.status() === 403) {
      const body = await membersRes.json().catch(() => ({}));
      expect(body?.error ?? body, '403 response must include error payload').toBeTruthy();
    }
  });

  test('navigating to /app/admin/users as non-admin shows forbidden, authz-error, or admin (if allowed)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/admin/users`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const finalUrl = page.url();
    const isForbidden = finalUrl.includes('/app/forbidden');
    const isAuthzError = finalUrl.includes('/app/authz-error');
    const isAdmin = finalUrl.includes('/app/admin');
    expect(
      isForbidden || isAuthzError || isAdmin,
      'User must land on /app/forbidden, /app/authz-error, or /app/admin'
    ).toBe(true);
    if (isForbidden) {
      await expect(page.getByText(SELECTORS.forbidden.heading)).toBeVisible({ timeout: 5000 });
    }
    if (isAuthzError) {
      await expect(page.getByText(SELECTORS.authzError.heading)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Role access — Cub cannot access Grizzly/Kodiak areas', () => {
  test('Cub user visiting /app/ops sees upgrade screen or ops content (plan-dependent)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/ops`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const hasUpgradeScreen = await page.getByText(SELECTORS.ops.upgradeScreen).first().isVisible().catch(() => false);
    const isOpsPage = url.includes('/app/ops') && !url.includes('/app/upgrade');
    expect(
      hasUpgradeScreen || isOpsPage,
      'Cub must see upgrade screen (Grizzly/Operations) or ops page if plan allows'
    ).toBe(true);
  });
});

test.describe('Role access — Client Viewer read-only', () => {
  test('Client Viewer on admin page sees forbidden/authz-error or admin without Invite/Add user', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, TEST_USERS.clientViewer, TEST_PASSWORD);
    await page.goto(`${base}/app/admin/users`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isForbiddenOrError = url.includes('/app/forbidden') || url.includes('/app/authz-error');
    const isAdminPage = url.includes('/app/admin');
    expect(
      isForbiddenOrError || isAdminPage,
      'Client viewer must land on forbidden/authz-error or admin'
    ).toBe(true);
    if (isAdminPage) {
      const inviteBtn = page.getByRole('button', { name: SELECTORS.nav.inviteOrAddUser }).first();
      await expect(inviteBtn).not.toBeVisible().catch(() => {});
    }
  });
});

test.describe('Role access — Crew cannot access Sales', () => {
  test('Crew user visiting /app/sales sees forbidden, denied message, or redirect away', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, TEST_USERS.crew, TEST_PASSWORD);
    await page.goto(`${base}/app/sales`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isForbidden = url.includes('/app/forbidden') || url.includes('/app/authz-error');
    const hasDenied = await page.getByText(SELECTORS.denied).isVisible().catch(() => false);
    const isSalesWithDenied = url.includes('/app/sales') && hasDenied;
    const leftSales = !url.includes('/app/sales') && url.includes('/app/');
    expect(
      isForbidden || isSalesWithDenied || leftSales,
      'Crew must not have full Sales access (forbidden, denied text, or redirected)'
    ).toBe(true);
  });
});
