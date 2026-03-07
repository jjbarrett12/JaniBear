/**
 * Shared E2E auth helpers. Use for consistent login and reduced flakiness.
 */
import { Page } from '@playwright/test';

const LOGIN_TIMEOUT = 20000;

/**
 * Fill login form and submit. Assumes page is on /auth/login.
 * Waits for redirect to app or onboarding (URL match).
 */
export async function loginWithPassword(
  page: Page,
  baseURL: string,
  email: string,
  password: string
): Promise<void> {
  const base = baseURL ?? 'http://localhost:3001';
  await page.goto(`${base}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/\/(app\/|onboarding)/, { timeout: LOGIN_TIMEOUT });
}
