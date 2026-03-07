/**
 * Operations flow: assign crew, create service schedule, complete service event.
 * Requires E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD and org with Grizzly for full ops access.
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials, SELECTORS } from './helpers/selectors';

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run operations-flow E2E tests.');
});

test.describe('Operations flow — navigation and surfaces', () => {
  test('Ops Crews page loads when ops enabled', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/ops/crews`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isCrews = url.includes('/app/ops/crews');
    const hasUpgrade = await page.getByText(SELECTORS.ops.upgradeScreen).first().isVisible().catch(() => false);
    expect(isCrews || url.includes('/app/upgrade') || hasUpgrade, 'Must land on crews or upgrade').toBe(true);
    if (isCrews) {
      await expect(page.getByText(SELECTORS.ops.crewsHeading).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('Ops Schedules page loads when ops enabled', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/ops/schedules`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isSchedules = url.includes('/app/ops/schedules');
    const hasUpgrade = await page.getByText(SELECTORS.ops.upgradeScreen).first().isVisible().catch(() => false);
    expect(isSchedules || url.includes('/app/upgrade') || hasUpgrade, 'Must land on schedules or upgrade').toBe(true);
  });

  test('Ops Accounts page loads when ops enabled', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/ops/accounts`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isAccounts = url.includes('/app/ops/accounts');
    const hasUpgrade = await page.getByText(SELECTORS.ops.upgradeScreen).first().isVisible().catch(() => false);
    expect(isAccounts || url.includes('/app/upgrade') || hasUpgrade, 'Must land on accounts or upgrade').toBe(true);
  });
});
