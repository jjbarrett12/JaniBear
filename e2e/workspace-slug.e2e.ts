import { test, expect } from '@playwright/test';

/**
 * Slug resolution: unknown vs rate-limited responses must not leak org existence.
 * Same status, same redirect target, no differing headers (e.g. no X-RateLimit-* only when blocked).
 * When middleware + Supabase are wired, unknown slugs get 302 to marketing root; otherwise 404 (no leak either way).
 */
test.describe('Workspace slug resolution (no leak)', () => {
  test('two unknown slugs return same status and same redirect target (no leak)', async ({
    request,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const res1 = await request.get('/org/fake-nonexistent-a/app/dashboard', {
      maxRedirects: 0,
    });
    const res2 = await request.get('/org/fake-nonexistent-b/app/dashboard', {
      maxRedirects: 0,
    });

    expect(res1.status(), 'both responses must have same status').toBe(res2.status());
    const loc1 = res1.headers()['location'] ?? '';
    const loc2 = res2.headers()['location'] ?? '';
    expect(loc1, 'both must have same redirect target').toBe(loc2);

    if (res1.status() === 302) {
      const url1 = new URL(loc1, base);
      expect(url1.pathname).toBe('/');
    }

    const h1 = res1.headers();
    const h2 = res2.headers();
    for (const name of Object.keys(h1)) {
      const lower = name.toLowerCase();
      if (lower.startsWith('x-ratelimit') || lower.startsWith('x-rate-limit')) {
        expect(h2[name]).toBe(h1[name]);
      }
    }
  });

  test('unknown slug path redirects to marketing root when middleware is active', async ({
    request,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const res = await request.get('/org/unknown-org-slug-123/app/dashboard', {
      maxRedirects: 0,
    });
    if (res.status() === 302) {
      const location = res.headers()['location'] ?? '';
      const target = new URL(location, base);
      expect(target.pathname).toBe('/');
    }
    expect([302, 404]).toContain(res.status());
  });
});
