/**
 * Tenant isolation: user from org A cannot access org B records (API and org list).
 * Uses E2E_OTHER_ORG_ID or .e2e-ids.json bravoOrgId. Requires E2E_LOGIN_EMAIL + E2E_LOGIN_PASSWORD (user in org A).
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginWithPassword } from './helpers/auth';
import { getDefaultLogin, skipWithoutE2ECredentials } from './helpers/selectors';

const E2E_IDS_PATH = process.env.E2E_IDS_PATH || '.e2e-ids.json';

function getOtherOrgId(): string {
  const other = process.env.E2E_OTHER_ORG_ID;
  if (other) return other;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), E2E_IDS_PATH), 'utf-8');
    const ids = JSON.parse(raw) as { bravoOrgId?: string };
    if (ids.bravoOrgId) return ids.bravoOrgId;
  } catch {
    // fallback: any UUID not in user's orgs still must return 403
  }
  return '00000000-0000-0000-0000-000000000002';
}

test.beforeEach(() => {
  test.skip(skipWithoutE2ECredentials(), 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run tenant-isolation E2E tests.');
});

test.describe('Tenant isolation — cross-org API', () => {
  test('GET /api/orgs/[other_org_id]/members returns 403 when user is not in that org', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const otherOrgId = getOtherOrgId();
    const res = await page.request.get(`${base}/api/orgs/${otherOrgId}/members`, {
      failOnStatusCode: false,
    });
    expect(res.status(), 'User from org A must get 403 when accessing org B members').toBe(403);
  });

  test('GET /api/billing/entitlements?org_id=[other_org_id] returns 403 when user is not in that org', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const otherOrgId = getOtherOrgId();
    const res = await page.request.get(`${base}/api/billing/entitlements?org_id=${otherOrgId}`, {
      failOnStatusCode: false,
    });
    expect(res.status(), 'User from org A must get 403 for org B entitlements').toBe(403);
  });

  test('GET /api/org/list returns only orgs user belongs to (no other tenant)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const otherOrgId = getOtherOrgId();
    const res = await page.request.get(`${base}/api/org/list`, { failOnStatusCode: false });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { orgs?: { id: string }[] };
    const ownIds = (body.orgs ?? []).map((o) => o.id);
    expect(ownIds, 'Org list must not include org B when user is in org A only').not.toContain(otherOrgId);
  });

  /**
   * Cross-org entity-by-id: user in org A must not receive org B's data when calling
   * an API that takes an entity id (e.g. account). Use E2E_OTHER_ORG_ACCOUNT_ID or any
   * UUID not in user's org; expect 403 or 200 with null/empty data (no leak).
   */
  test('GET /api/app/risk/accounts/[other_org_account_id] returns 403 or empty data (no cross-org leak)', async ({
    page,
    baseURL,
  }) => {
    const creds = getDefaultLogin();
    if (!creds) return;
    const base = baseURL ?? 'http://localhost:3001';
    await loginWithPassword(page, base, creds.email, creds.password);
    const otherOrgAccountId =
      process.env.E2E_OTHER_ORG_ACCOUNT_ID ?? '00000000-0000-0000-0000-000000000099';
    const res = await page.request.get(`${base}/api/app/risk/accounts/${otherOrgAccountId}`, {
      failOnStatusCode: false,
    });
    if (res.status() === 403) {
      expect(res.status()).toBe(403);
      return;
    }
    if (res.status() === 200) {
      const body = (await res.json()) as { account?: unknown; snapshot?: unknown };
      expect(
        body.account == null && (body.snapshot == null || body.snapshot === null),
        'Must not return another org account or snapshot'
      ).toBe(true);
      return;
    }
    expect([403, 200], 'Expect 403 or 200 with no data').toContain(res.status());
  });
});
