/**
 * Next.js instrumentation hook — runs once when the Node server starts.
 * Used for one-time server-side setup (e.g. Sentry tags). Sentry SDK is already
 * initialized via sentry.server.config.ts; do not re-init here.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const Sentry = await import('@sentry/nextjs');
      if (Sentry.setTag) {
        Sentry.setTag('runtime', 'nodejs');
      }
    } catch {
      // Sentry not available
    }
  }
}
