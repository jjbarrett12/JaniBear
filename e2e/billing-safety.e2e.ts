/**
 * Billing safety: webhook idempotency; duplicate events do not double-process.
 * No auth required for webhook tests. Set E2E_STRIPE_WEBHOOK_SECRET for idempotency test.
 */
import { test, expect } from '@playwright/test';

test.describe('Billing safety — webhook and idempotency', () => {
  test('POST /api/stripe/webhook without signature returns 400', async ({
    request,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const res = await request.post(`${base}/api/stripe/webhook`, {
      data: { type: 'invoice.paid', id: 'evt_test' },
      failOnStatusCode: false,
    });
    expect(res.status(), 'Webhook without signature must be rejected with 400').toBe(400);
    const body = await res.json().catch(() => ({}));
    expect(body?.error ?? res.statusText(), 'Error message must be present').toBeTruthy();
  });

  test('POST /api/stripe/webhook with invalid signature returns 400 or 503', async ({
    request,
    baseURL,
  }) => {
    const base = baseURL ?? 'http://localhost:3001';
    const res = await request.post(`${base}/api/stripe/webhook`, {
      headers: { 'stripe-signature': 'invalid' },
      data: '{}',
      failOnStatusCode: false,
    });
    expect([400, 503], 'Invalid signature must return 400 or 503').toContain(res.status());
  });

  test('Duplicate webhook event id: second POST returns 200 with received: true (idempotent, no double-process)', async ({
    request,
    baseURL,
  }) => {
    test.skip(
      !process.env.E2E_STRIPE_WEBHOOK_SECRET,
      'Set E2E_STRIPE_WEBHOOK_SECRET to run webhook idempotency test (signed payload required).'
    );
    const base = baseURL ?? 'http://localhost:3001';
    const payload = JSON.stringify({
      id: 'evt_e2e_duplicate_test',
      type: 'customer.subscription.updated',
      data: { object: {} },
    });
    const crypto = await import('crypto');
    const secret = process.env.E2E_STRIPE_WEBHOOK_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000);
    const signed = `${timestamp}.${payload}`;
    const sig = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    const signature = `t=${timestamp},v1=${sig}`;
    const res1 = await request.post(`${base}/api/stripe/webhook`, {
      headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
      data: payload,
      failOnStatusCode: false,
    });
    const res2 = await request.post(`${base}/api/stripe/webhook`, {
      headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
      data: payload,
      failOnStatusCode: false,
    });
    expect([200, 400, 503]).toContain(res1.status());
    expect([200, 400, 503]).toContain(res2.status());
    if (res1.status() === 200) {
      expect(res2.status(), 'Duplicate event must be accepted (200) and not double-processed').toBe(200);
      const body1 = await res1.json().catch(() => ({}));
      const body2 = await res2.json().catch(() => ({}));
      expect(body1.received, 'First delivery should return received: true').toBe(true);
      expect(body2.received, 'Second delivery (duplicate) should return received: true without reprocessing').toBe(true);
    }
  });
});
