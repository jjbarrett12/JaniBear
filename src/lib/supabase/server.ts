import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

/** Parse Cookie header into { name, value }[] for Supabase. */
function parseCookieHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader?.trim()) return [];
  return cookieHeader.split(';').map((part) => {
    const [name, ...rest] = part.trim().split('=');
    const value = rest.join('=').trim();
    return { name: (name ?? '').trim(), value };
  }).filter((c) => c.name);
}

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const fromStore = cookieStore.getAll();
          // On client-side navigation, cookies() can be empty even when the request has Cookie header.
          // Fall back to parsing Cookie so auth and RLS work in layout/pages.
          if (fromStore.length > 0) return fromStore;
          const cookieHeader = headersList.get('cookie');
          return parseCookieHeader(cookieHeader);
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
