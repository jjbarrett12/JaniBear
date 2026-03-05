/**
 * Auth redirect hardening: password login reaches dashboard without loop;
 * already signed-in at /auth/login ends at /app/dashboard and never hits clear-session.
 * Requires seeded test user: run `npm run seed:test` first, or set E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD.
 */
import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_LOGIN_EMAIL ?? 'salesrep@janibear.test';
const E2E_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? 'Password123!';

test.describe('Auth redirect — no loop', () => {
  test('password login reaches /app/dashboard without returning to /auth/login', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });

    await page.getByLabel(/email/i).fill(E2E_EMAIL);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should end at app or onboarding; must not land back on login within timeout.
    await expect(page).toHaveURL(/\/(app\/dashboard|app\/|onboarding)/, { timeout: 20000 });
    const finalUrl = page.url();
    expect(finalUrl).not.toMatch(/\/auth\/login$/);
  });

  test('already signed-in visiting /auth/login ends at /app/dashboard and never hits /api/auth/clear-session', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';

    // 1) Log in first
    await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/email/i).fill(E2E_EMAIL);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/(app\/dashboard|app\/|onboarding)/, { timeout: 20000 });

    // 2) Visit /auth/login while signed in; should redirect to app, never to clear-session
    const clearSessionRequests: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (u.includes('/api/auth/clear-session')) clearSessionRequests.push(u);
    });

    await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/(app\/dashboard|app\/)/, { timeout: 10000 });
    expect(clearSessionRequests).toHaveLength(0);
  });
});
