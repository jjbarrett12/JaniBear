import { createBrowserClient } from '@supabase/ssr';

// Use secure cookies on HTTPS (production) so auth cookies are sent correctly
const isSecure =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' &&
  process.env.NEXT_PUBLIC_APP_URL.startsWith('https');

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        path: '/',
        sameSite: 'lax',
        secure: isSecure,
      },
    }
  );
}
