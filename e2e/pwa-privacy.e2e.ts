import { test, expect } from '@playwright/test';

/**
 * PWA privacy: /app/* document must never be served from cache when offline.
 * After loading /app/dashboard once, go offline and reload — must NOT get cached dashboard HTML.
 */
test.describe('PWA privacy — no cached /app/* documents', () => {
  test('offline refresh to /app/dashboard does not serve cached dashboard', async ({
    page,
    context,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';

    await page.goto(`${base}/app/dashboard`, { waitUntil: 'domcontentloaded' });
    await context.setOffline(true);

    // Navigate again while offline. SW must not cache /app/* documents, so this should fail
    // (network error) or show browser offline page — not a 200 with cached dashboard HTML.
    const response = await page.goto(`${base}/app/dashboard`, {
      waitUntil: 'commit',
      timeout: 8000,
    }).catch(() => null);

    if (response && response.status() === 200) {
      const finalUrl = response.url();
      if (finalUrl.includes('/app/dashboard')) {
        const body = await response.text();
        // If we got 200 with full HTML for /app/dashboard while offline, SW cached the doc (bad)
        expect(body.length, 'SW must not serve cached /app/* document when offline').toBeLessThan(1000);
      }
    }
    await context.setOffline(false);
  });
});
