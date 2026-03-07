/**
 * Regression: Authorized users must never see /app/forbidden during navigation between modules.
 * No content flash on forbidden: login → click nav links → URL must never be /app/forbidden.
 */
import { test, expect } from '@playwright/test';
import { getDefaultLogin, skipWithoutE2ECredentials, SELECTORS } from './helpers/selectors';

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run forbidden-no-flash E2E tests.');
});

test.describe('Forbidden — no flash for authorized user', () => {
  test.describe.configure({ mode: 'serial' });

  test('click 10 nav links: URL never equals /app/forbidden during navigation', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';

    const creds = getDefaultLogin();
    if (!creds) return;
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(SELECTORS.login.emailInput).fill(creds.email);
    await page.getByLabel(SELECTORS.login.passwordInput).fill(creds.password);
    await page.getByRole('button', { name: SELECTORS.login.submitButton }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    const navTargets = [
      { name: /Dashboard/i },
      { name: /HelpHubQR/i },
      { name: /Settings/i },
      { name: /Alerts/i },
      { name: /Reports|KPIs/i },
      { name: /Map/i },
      { name: /Training|University/i },
      { name: /Pro Gear|Shop/i },
      { name: /Admin/i },
      { name: /Dashboard/i },
    ];

    const seenForbidden: string[] = [];
    page.on('framenavigated', () => {
      const url = page.url();
      if (url.includes('/app/forbidden')) seenForbidden.push(url);
    });

    for (const { name } of navTargets) {
      const link = page.getByRole('link', { name }).first();
      await link.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      const current = page.url();
      expect(
        current,
        `After clicking nav, URL must not be /app/forbidden (authorized user). Got: ${current}`
      ).not.toMatch(/\/app\/forbidden$/);
    }

    expect(seenForbidden, 'URL must never have been /app/forbidden during navigation').toHaveLength(0);
  });
});

test.describe('Authz error page', () => {
  test('/app/authz-error shows message and Retry / Back to Dashboard / Contact Support', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(SELECTORS.login.emailInput).fill(creds.email);
    await page.getByLabel(SELECTORS.login.passwordInput).fill(creds.password);
    await page.getByRole('button', { name: SELECTORS.login.submitButton }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });
    await page.goto(`${base}/app/authz-error`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(SELECTORS.authzError.heading)).toBeVisible();
    await expect(page.getByRole('button', { name: SELECTORS.authzError.retry })).toBeVisible();
    await expect(page.getByRole('link', { name: SELECTORS.authzError.backToDashboard })).toBeVisible();
    await expect(page.getByRole('link', { name: /contact support/i })).toBeVisible();
  });

  test('when authz RPC is forced to fail (E2E_AUTHZ_SIMULATE_FAIL=1), user lands on /app/authz-error', async ({
    page,
    baseURL,
  }) => {
    test.skip(process.env.E2E_AUTHZ_SIMULATE_FAIL !== '1', 'Set E2E_AUTHZ_SIMULATE_FAIL=1 to run');
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(SELECTORS.login.emailInput).fill(creds.email);
    await page.getByLabel(SELECTORS.login.passwordInput).fill(creds.password);
    await page.getByRole('button', { name: SELECTORS.login.submitButton }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });
    await page.goto(`${base}/app/ops`, {
      waitUntil: 'domcontentloaded',
      headers: { 'x-test-simulate-authz-fail': '1' },
    });
    await expect(page).toHaveURL(/\/app\/authz-error/);
    await expect(page.getByText(SELECTORS.authzError.heading)).toBeVisible();
  });
});
