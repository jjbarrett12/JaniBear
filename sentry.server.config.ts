/**
 * Sentry server-side init (Node). Only active when SENTRY_DSN is set.
 * Production observability: app/API/server-action errors; no PII in events.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error && typeof event.extra === 'object') {
        const extra = event.extra as Record<string, unknown>;
        for (const key of Object.keys(extra)) {
          const lower = key.toLowerCase();
          if (['password', 'token', 'secret', 'authorization', 'cookie', 'apikey', 'stripe_secret', 'key'].some((s) => lower.includes(s))) {
            extra[key] = '[REDACTED]';
          }
        }
      }
      return event;
    },
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      /^Loading chunk \d+ failed/,
    ],
  });
}
