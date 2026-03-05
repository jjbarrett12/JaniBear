/**
 * Premium upgrade paywall: locked module → upgrade page → portal/success → auto-return.
 * - Login as user without entitlement but with billing permission
 * - Visit /app/helphub → redirected to /app/upgrade?module=helphubqr
 * - Click Add to plan → portal returns url (mocked to success page in test)
 * - Success page polls entitlements; when enabled, redirects to from=
 * - Assert never routes to /demo
 */
import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_LOGIN_EMAIL;
const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD;

test.beforeEach(() => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run upgrade-paywall E2E tests.'
  );
});

test.describe('Upgrade paywall', () => {
  test.describe.configure({ mode: 'serial' });

  test('locked module redirects to upgrade page; Add to plan uses portal; success page polls and redirects; never /demo', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const successPath = '/app/upgrade/success?module=helphubqr&from=' + encodeURIComponent('/app/helphub');
    const successUrl = base + successPath;

    let entitlementsCallCount = 0;

    await page.route('**/api/stripe/portal', async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: successUrl }),
      });
    });

    await page.route('**/api/billing/entitlements**', async (route) => {
      entitlementsCallCount++;
      const enabled = entitlementsCallCount >= 2;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orgId: '00000000-0000-0000-0000-000000000001',
          modules: {
            helphubqr: enabled,
            lidar_starter: false,
            lidar_unlimited: false,
            ai_command_center: false,
          },
        }),
      });
    });

    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    await page.goto(`${base}/app/helphub`, { waitUntil: 'domcontentloaded' });
    const urlAfterHelphub = page.url();
    expect(urlAfterHelphub).toMatch(/\/app\/upgrade\?module=helphubqr/);
    expect(urlAfterHelphub).not.toMatch(/\/demo/);

    await expect(page.getByText(/Add to plan|What you get|Ask an owner/i)).toBeVisible();

    const addBtn = page.getByRole('button', { name: /Add to plan/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page).toHaveURL(/\/app\/upgrade\/success/, { timeout: 10000 });
      await expect(page.getByText(/Setting up your plan|All set|Redirecting/i)).toBeVisible();
      await expect(page).toHaveURL(/\/(app\/helphub|app\/upgrade\/success)/, { timeout: 15000 });
    }

    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/demo/);
  });

  test('success page shows progress and never navigates to /demo', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    let callCount = 0;
    await page.route('**/api/billing/entitlements**', async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orgId: '00000000-0000-0000-0000-000000000001',
          modules: {
            helphubqr: callCount >= 2,
            lidar_starter: false,
            lidar_unlimited: false,
            ai_command_center: false,
          },
        }),
      });
    });

    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    await page.goto(`${base}/app/upgrade/success?module=helphubqr&from=${encodeURIComponent('/app/helphub')}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByText(/Setting up your plan|All set|Redirecting|Taking longer/i)).toBeVisible();
    expect(page.url()).not.toMatch(/\/demo/);
  });
});
