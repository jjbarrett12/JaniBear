'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker once for app routes.
 * Mount in app layout (or root) so /sw.js is registered when user is in the workspace.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[PWA] Service worker registered', reg.scope);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[PWA] Service worker registration failed', err);
        }
      });
  }, []);

  return null;
}
