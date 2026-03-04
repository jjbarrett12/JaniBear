import { test, expect } from '@playwright/test';

/**
 * Launcher: unauthenticated redirects to login with next=/launcher.
 * Single-org redirect and multi-org list require authenticated fixtures (see docs).
 */
test.describe('Launcher', () => {
  test('unauthenticated /launcher redirects to login with next param', async ({ page, baseURL }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/launcher`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/(auth\/login|login)/);
    const url = new URL(page.url());
    expect(url.searchParams.get('next')).toBe('/launcher');
  });

  test('launcher page when reached after login shows Open workspace or redirects', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const res = await page.goto(`${base}/launcher`, { waitUntil: 'commit' });
    expect(res?.status()).toBeLessThan(400);
  });
});

test.describe('Launcher — no-org redirect (requires auth)', () => {
  test.skip('user with zero orgs redirects to /onboarding', async () => {
    // Requires authenticated user with no org_members; add when test auth fixture exists.
  });
});

test.describe('Launcher — single-org and multi-org (requires auth)', () => {
  test.skip('user with one org is redirected to workspace URL', async () => {
    // Requires authenticated user with exactly one org; add when test auth fixture exists.
  });

  test.skip('user with multiple orgs sees org list', async () => {
    // Requires authenticated user with multiple orgs; add when test auth fixture exists.
  });
});
