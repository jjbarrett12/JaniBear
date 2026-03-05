/**
 * Route crawl: canonical /app/* nav links must not 404.
 * Visits each route (unauthenticated); expects 200 (if allowed) or 302/307 (redirect to login).
 * Run: npx playwright test e2e/route-crawl.e2e.ts
 */
import { test, expect } from '@playwright/test';

const SIDEBAR_ROUTES = [
  '/app/dashboard',
  '/app/executive',
  '/app/financial-health',
  '/app/alerts',
  '/app/kpis',
  '/app/map',
  '/app/benchmarks',
  '/app/helphub',
  '/app/sales/leads',
  '/app/sales/pipeline',
  '/app/ops/launch-intake',
  '/app/ops/accounts',
  '/app/sites',
  '/app/ops/inspections',
  '/app/issues',
  '/app/admin',
  '/app/settings',
  '/app/university',
  '/app/pro-gear',
];

test.describe('Route crawl — no 404 for nav links', () => {
  for (const path of SIDEBAR_ROUTES) {
    test(`${path} returns 200 or 302 (no 404)`, async ({ request, baseURL }) => {
      const url = `${baseURL ?? 'http://localhost:3001'}${path}`;
      const res = await request.get(url, { maxRedirects: 0 });
      const status = res.status();
      expect(
        status === 200 || status === 302 || status === 307,
        `${path} should return 200 or 302/307, got ${status}`
      ).toBe(true);
    });
  }
});
