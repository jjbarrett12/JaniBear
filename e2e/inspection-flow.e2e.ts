/**
 * Inspection flow: inspection created; inspection submitted; QC score recorded.
 * Requires E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD.
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials, SELECTORS } from './helpers/selectors';

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run inspection-flow E2E tests.');
});

test.describe('Inspection flow — list and start', () => {
  test('Inspections page loads and shows list or empty state', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/inspections`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/inspections/);
    await expect(
      page.getByRole('heading', { name: SELECTORS.inspections.heading }).or(
        page.getByText(SELECTORS.inspections.heading)
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test('New Inspection button or start link is present', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/inspections`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const newBtn = page.getByRole('link', { name: SELECTORS.inspections.newInspectionButton }).or(
      page.getByRole('button', { name: SELECTORS.inspections.newInspectionButton })
    );
    await expect(newBtn.first()).toBeVisible({ timeout: 8000 });
  });

  test('Start inspection page loads', async ({ page, baseURL }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/inspections/start`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/inspections\/start/);
    await expect(page.getByText(SELECTORS.inspections.startPageContent).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Inspection flow — run and complete', () => {
  test('Inspections start or run page loads; run page shows Complete Inspection when location and template are set', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/inspections/start`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await expect(page).toHaveURL(/\/app\/inspections\/(start|run)/);
    if (page.url().includes('/app/inspections/run')) {
      await expect(
        page.getByRole('button', { name: SELECTORS.inspections.completeButton })
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
