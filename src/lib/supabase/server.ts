import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Use secure cookies on HTTPS (production) so auth cookies work on janibear.com
const isSecure =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' &&
  process.env.NEXT_PUBLIC_APP_URL.startsWith('https');

const serverCookieOptions = { path: '/', sameSite: 'lax' as const, secure: isSecure };

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: serverCookieOptions,
      cookies: {
        get(key: string) {
          return cookieStore.get(key)?.value ?? null;
        },
        set(key: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(key, value, { ...serverCookieOptions, ...options });
          } catch {
            // Server Components cannot set cookies; middleware handles refresh.
          }
        },
        remove(key: string, options: Record<string, unknown>) {
          try {
            cookieStore.set(key, '', { ...serverCookieOptions, ...options, maxAge: 0 });
          } catch {
            // Server Components cannot set cookies.
          }
        },
      },
    }
  );
}
