/**
 * Regression: Dashboard navigation must never show marketing footer/CTA.
 * - Sign in, click HelpHubQR (or any dashboard link); marketing footer must not appear.
 * - URL must change directly to the target (e.g. /app/helphub) without flashing home.
 * Requires E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD.
 */
import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_LOGIN_EMAIL;
const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD;

// Marketing footer CTA text that must never appear during app navigation
const MARKETING_FOOTER_CTA = 'Ready to run your cleaning business in one place?';
const MARKETING_FOOTER_DEMO = 'Get a Private Demo';

test.beforeEach(() => {
  test.skip(
    !E2E_EMAIL || !E2E_PASSWORD,
    'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run dashboard no-flash E2E tests.'
  );
});

test.describe('Dashboard navigation — no marketing flash', () => {
  test.describe.configure({ mode: 'serial' });

  test('click HelpHubQR: URL goes to /app/helphub and marketing footer CTA is never visible', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';

    // 1) Sign in and land on dashboard (or onboarding)
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    // 2) Click HelpHubQR in sidebar (link text from nav)
    await page.getByRole('link', { name: /HelpHubQR/i }).click();

    // 3) Wait for URL to be /app/helphub (or helphub/setup etc.) — direct client-side nav, no intermediate full reload
    await expect(page).toHaveURL(/\/app\/helphub/, { timeout: 15000 });

    // 4) Assert marketing footer CTA is not visible on the dashboard page (no flash)
    await expect(page.getByText(MARKETING_FOOTER_CTA)).not.toBeVisible();
    await expect(page.getByText(MARKETING_FOOTER_DEMO)).not.toBeVisible();

    // 5) Final URL should be canonical HelpHubQR page
    expect(page.url()).toMatch(/\/app\/helphub(\/|$)/);
  });

  test('click multiple nav items: no marketing footer CTA, no hard reload to marketing', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';

    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL!);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/|onboarding)/, { timeout: 20000 });

    const navTargets = [
      { name: /HelpHubQR/i, urlMatch: /\/app\/helphub/ },
      { name: /Dashboard/i, urlMatch: /\/app\/dashboard/ },
      { name: /Settings/i, urlMatch: /\/app\/settings/ },
    ];

    for (const { name, urlMatch } of navTargets) {
      await page.getByRole('link', { name }).first().click();
      await expect(page).toHaveURL(urlMatch, { timeout: 10000 });
      await expect(page.getByText(MARKETING_FOOTER_CTA)).not.toBeVisible();
      await expect(page.getByText(MARKETING_FOOTER_DEMO)).not.toBeVisible();
    }

    // Never left app (no full reload to marketing)
    expect(page.url()).toMatch(/\/app\//);
  });
});
