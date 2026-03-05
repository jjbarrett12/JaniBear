import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { serverEnv } from '@/lib/env';

type CookieRecord = { name: string; value: string };

type RouteContext = {
  request: NextRequest;
  response?: NextResponse;
};

function parseCookieHeader(cookieHeader: string | null): CookieRecord[] {
  if (!cookieHeader?.trim()) return [];
  return cookieHeader
    .split(';')
    .map((part) => {
      const [name, ...rest] = part.trim().split('=');
      return { name: (name ?? '').trim(), value: rest.join('=').trim() };
    })
    .filter((cookie) => cookie.name.length > 0);
}

function getRequestCookies(request: NextRequest): CookieRecord[] {
  const fromStore = request.cookies.getAll();
  if (fromStore.length > 0) return fromStore;
  return parseCookieHeader(request.headers.get('cookie'));
}

/**
 * App Router server helper for Supabase.
 * - In Server Components/actions: call without args (uses next/headers cookies).
 * - In Route Handlers: pass { request, response } so setAll writes to the outgoing response.
 */
export async function supabaseServer(context?: RouteContext): Promise<SupabaseClient> {
  if (context?.request) {
    const response = context.response;
    return createServerClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return getRequestCookies(context.request);
        },
        setAll(cookiesToSet) {
          if (!response) return;
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, path: '/' });
          });
        },
      },
    });
  }

  const cookieStore = await cookies();
  const headersList = await headers();

  return createServerClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        const fromStore = cookieStore.getAll();
        if (fromStore.length > 0) return fromStore;
        return parseCookieHeader(headersList.get('cookie'));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, { ...options, path: '/' });
          });
        } catch {
          // Server Components cannot always mutate cookies; middleware/handlers should handle refresh writes.
        }
      },
    },
  });
}

export async function getUserOrNull(context?: RouteContext): Promise<User | null> {
  const supabase = await supabaseServer(context);
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

// Backward compatibility for existing imports.
export async function createClient(): Promise<SupabaseClient> {
  return supabaseServer();
}
