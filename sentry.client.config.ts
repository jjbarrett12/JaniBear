/**
 * Sentry client-side init. Only active when SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN is set.
 * Do not log PII (sendDefaultPii: false). Loaded automatically by withSentryConfig.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  });
}
