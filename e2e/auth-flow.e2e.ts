/**
 * Auth flow: protected routes redirect properly; no content flash on forbidden pages.
 */
import { test, expect } from '@playwright/test';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials } from './helpers/selectors';

test.describe('Auth flow — protected routes redirect', () => {
  test('unauthenticated /app/dashboard redirects to login', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page, 'Unauthenticated user must be redirected to login').toHaveURL(/\/(auth\/login|login)/, { timeout: 10000 });
  });

  test('unauthenticated /app/sales/leads redirects to login', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/app/sales/leads`, { waitUntil: 'domcontentloaded' });
    await expect(page, 'Unauthenticated user must be redirected to login').toHaveURL(/\/(auth\/login|login)/, { timeout: 10000 });
  });

  test('after login, protected route shows app content (no redirect loop)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page, 'Must not redirect back to login').not.toHaveURL(/\/(auth\/login|login)$/);
    await expect(page, 'Must be in app').toHaveURL(/\/app\//);
  });
});

test.describe('Auth flow — no content flash on forbidden', () => {
  test('authorized user navigating app links does not land on /app/forbidden', async ({
    page,
    baseURL,
  }) => {
    test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD');
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const seenForbidden: string[] = [];
    page.on('framenavigated', () => {
      if (page.url().includes('/app/forbidden')) seenForbidden.push(page.url());
    });
    await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /Settings/i }).first().click().catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    expect(seenForbidden, 'Authorized user must not see /app/forbidden during nav').toHaveLength(0);
  });
});
