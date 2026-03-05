/**
 * RBAC + onboarding E2E: golden path (sales rep), permission gating (crew → 403), cross-tenant denial.
 * Run after seed:test. baseURL from playwright.config (e.g. http://localhost:3001).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SALESREP_EMAIL = 'salesrep@janibear.test';
const CREW_EMAIL = 'crew@janibear.test';
const PASSWORD = 'Password123!';

test.describe('Auth + onboarding', () => {
  test('A) Golden path: login as sales rep, redirect to /app, Sales route loads with heading', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(SALESREP_EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(app|api\/auth\/landing)/, { timeout: 15000 });
    await page.goto(`${base}/app/sales`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /sales/i })).toBeVisible();
    await expect(page.getByText('allowed')).toBeVisible();
  });

  test('B) Permission gating: crew cannot access Sales, sees forbidden or redirect', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(CREW_EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(app|api\/auth\/landing)/, { timeout: 15000 });
    await page.goto(`${base}/app/sales`, { waitUntil: 'networkidle' });
    const url = page.url();
    const isForbidden = url.includes('/app/forbidden') || (await page.getByText(/access denied|not allowed|don't have permission/i).isVisible());
    expect(isForbidden || url.includes('/app/dashboard')).toBeTruthy();
  });

  test('C) Cross-tenant: Alpha user cannot fetch Bravo org data (403)', async ({
    page,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const idsPath = path.join(process.cwd(), process.env.E2E_IDS_PATH || '.e2e-ids.json');
    let bravoOrgId: string;
    try {
      const raw = fs.readFileSync(idsPath, 'utf-8');
      const ids = JSON.parse(raw) as { bravoOrgId?: string };
      bravoOrgId = ids.bravoOrgId!;
    } catch {
      test.skip(true, 'Run seed:test first to create .e2e-ids.json with bravoOrgId');
      return;
    }
    await page.goto(`${base}/auth/login`, { waitUntil: 'networkidle' });
    await page.getByLabel(/email/i).fill(SALESREP_EMAIL);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(app|api\/auth\/landing)/, { timeout: 15000 });
    const res = await page.request.get(`${base}/api/orgs/${bravoOrgId}/members`, {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(403);
  });
});
