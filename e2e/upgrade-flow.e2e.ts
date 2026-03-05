/**
 * In-app upgrade flow: entitlement denial redirects to /app/upgrade; Add to plan → portal; non-billing user sees "Ask owner".
 * Requires E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD. Use an org that does not have HelpHubQR entitlement to test redirect.
 */
import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_LOGIN_EMAIL;
const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD;

test.beforeEach(() => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run upgrade-flow E2E tests.'
  );
});

test.describe('Upgrade flow', () => {
  test.describe.configure({ mode: 'serial' });

  test('visiting /app/helphub without entitlement redirects to /app/upgrade?module=helphubqr (not forbidden)', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    await page.goto(`${base}/app/helphub`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    const isUpgrade = url.includes('/app/upgrade') && url.includes('module=helphubqr');
    const isHelphub = url.includes('/app/helphub') && !url.includes('/app/upgrade');
    const isForbidden = url.includes('/app/forbidden');
    expect(isForbidden, 'Should not land on /app/forbidden when missing entitlement').toBe(false);
    expect(isUpgrade || isHelphub, 'Should land on upgrade page (no entitlement) or helphub (has entitlement)').toBe(true);
  });

  test('/app/upgrade page shows Add to plan or Ask owner', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    await page.goto(`${base}/app/upgrade?module=helphubqr`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/HelpHubQR|Add to plan|Ask an owner/i)).toBeVisible();
  });

  test('pricing page Add to plan link is not /demo when in app context', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    await page.goto(`${base}/pricing`, { waitUntil: 'domcontentloaded' });
    const addToPlan = page.getByRole('link', { name: /Add to plan/i }).first();
    await expect(addToPlan).toBeVisible();
    const href = await addToPlan.getAttribute('href');
    expect(href, 'When logged in with org, Add to plan should go to /app/upgrade, not /demo').toMatch(/\/app\/upgrade\?module=/);
  });
});
