import { test, expect } from '@playwright/test';

/**
 * Pre-launch E2E: onboarding correctness, plan gating, cross-tenant isolation.
 * Requires test Supabase + seeded users/orgs for full coverage; unauthenticated
 * and public redirects can be asserted without fixtures.
 */

test.describe('Onboarding — unauthenticated', () => {
  test('visiting /onboarding without auth shows sign-in prompt or redirects to login', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/onboarding`, { waitUntil: 'domcontentloaded' });
    const url = page.url();
    const redirectedToLogin = /\/auth\/login|\/login/.test(url);
    const hasSignInPrompt =
      (await page.getByRole('link', { name: /sign in/i }).isVisible().catch(() => false)) ||
      (await page.locator('text=/sign in to continue/i').isVisible().catch(() => false));
    expect(redirectedToLogin || hasSignInPrompt).toBeTruthy();
  });

  test('visiting /app/dashboard without auth redirects to login', async ({ page, baseURL }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/app/dashboard`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/(auth\/login|login)/);
  });
});

test.describe('Plan gating — unauthenticated', () => {
  test('visiting /app/ops without auth redirects to login', async ({ page, baseURL }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/app/ops`, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/(auth\/login|login)/);
  });
});

test.describe('Onboarding — new user flow (requires auth fixture)', () => {
  test.skip('new user completes signup → onboarding → create org → reaches dashboard', async () => {
    // 1. Sign up with test email (or use seeded test user with zero orgs).
    // 2. Land on /onboarding, fill org name, submit.
    // 3. Redirect to /auth/set-org-and-continue?next=/app/dashboard then /app/dashboard.
    // 4. Assert URL is /app/dashboard and dashboard content is visible.
    // Requires: test Supabase project, or Playwright storageState with fresh user.
  });
});

test.describe('Plan gating — Cub vs Grizzly (requires auth fixture)', () => {
  test.skip('Cub user visiting /app/ops sees upgrade screen or 403', async () => {
    // 1. Log in as user with org on Cub plan.
    // 2. Visit /app/ops (or /app/ops/launch-intake).
    // 3. Expect: OperationsUpgradeScreen content (e.g. "Grizzly") or 403, not ops content.
    // Requires: seeded user with org where plan = cub (or org_subscriptions.plan_code = 'cub').
  });
});

test.describe('Cross-tenant isolation (requires auth fixture)', () => {
  test.skip('request to other org API returns 403 and no data', async ({ request, baseURL }) => {
    // 1. Log in as user in org A (e.g. set cookie or storageState).
    // 2. GET /api/orgs/{org_b_id}/onboarding (org B != org A).
    // 3. Expect: 403 and no onboarding data for org B.
    // Requires: two orgs, user member of org A only; or use requireOrgMember in API (already enforced).
  });
});

test.describe('API cross-tenant — route param orgId', () => {
  test('unauthenticated request to org-scoped API returns 401', async ({
    request,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const fakeOrgId = '00000000-0000-0000-0000-000000000001';
    const res = await request.get(`${base}/api/orgs/${fakeOrgId}/onboarding`);
    expect(res.status()).toBe(401);
  });
});
