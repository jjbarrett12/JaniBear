/**
 * Launch flow: converted deal creates launch packet; launch packet visible to ops; ops activation.
 * Requires E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD and org with Grizzly for full flow.
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials, SELECTORS } from './helpers/selectors';

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run launch-flow E2E tests.');
});

test.describe('Launch flow — visibility', () => {
  test('Launch packets page shows list or empty state when ops enabled', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/launch-packets`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (!page.url().includes('/app/sales/launch-packets')) {
      test.skip(true, 'User redirected (Cub or win-loss); need Grizzly for launch-packets');
      return;
    }
    await expect(
      page.getByText(SELECTORS.sales.launchPacketsHeading)
    ).toBeVisible({ timeout: 10000 });
  });

  test('Ops launch intake is reachable when ops enabled', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/ops/launch-intake`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isLaunchIntake = url.includes('/app/ops/launch-intake');
    const hasUpgrade = await page.getByText(SELECTORS.ops.upgradeScreen).first().isVisible().catch(() => false);
    expect(
      isLaunchIntake || url.includes('/app/upgrade') || hasUpgrade,
      'Must land on launch-intake or upgrade screen'
    ).toBe(true);
  });
});
