/**
 * Sales flow: lead → walkthrough → proposal → convert → opportunity.
 * Requires E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD (user with sales access). Optional: seed a qualified lead.
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials, SELECTORS } from './helpers/selectors';

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run sales-flow E2E tests.');
});

test.describe('Sales flow — leads and navigation', () => {
  test('sales user can open Leads page and see list or empty state', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/leads`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page, 'Must land on sales leads').toHaveURL(/\/app\/sales\/leads/);
    await expect(
      page.getByRole('heading', { name: SELECTORS.sales.leadsHeading }).or(page.getByText(SELECTORS.sales.leadsListOrEmpty))
    ).toBeVisible({ timeout: 10000 });
  });

  test('sales user can open Proposals page', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/proposals`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/sales\/proposals/);
    await expect(page.getByText(SELECTORS.sales.proposalsHeading).first()).toBeVisible({ timeout: 10000 });
  });

  test('sales user can open Walkthroughs page', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/walkthroughs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/sales\/walkthroughs/);
    await expect(
      page.getByRole('heading', { name: SELECTORS.sales.walkthroughsHeading }).or(page.getByText(SELECTORS.sales.walkthroughsHeading))
    ).toBeVisible({ timeout: 10000 });
  });

  test('sales user can open Pipeline page', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/pipeline`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/sales\/pipeline/);
  });
});

test.describe('Sales flow — convert and opportunity', () => {
  test('Launch to Operations / launch-packets page is reachable for Grizzly user', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/sales/launch-packets`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const url = page.url();
    const isLaunchPage = url.includes('/app/sales/launch-packets');
    const isRedirect = url.includes('/app/upgrade') || url.includes('/app/sales/win-loss');
    expect(isLaunchPage || isRedirect, 'Must land on launch-packets or redirect (Cub/win-loss)').toBe(true);
    if (isLaunchPage) {
      await expect(page.getByText(SELECTORS.sales.launchPacketsHeading)).toBeVisible({ timeout: 5000 });
    }
  });
});
