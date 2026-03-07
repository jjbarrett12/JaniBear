'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Root-level error boundary for the app. Renders when layout or root errors occur.
 * Reports to Sentry when DSN is configured.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '480px', margin: '0 auto' }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try refreshing the page or contact support.</p>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
            {error.message || 'Unknown error'}
          </pre>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
