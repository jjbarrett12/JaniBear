import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const baseUrl = requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  const loginUrl = new URL('/auth/login', baseUrl);

  const response = NextResponse.redirect(loginUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? { path: '/' });
          });
        },
      },
    }
  );

  try {
    await supabase.auth.signOut();
  } catch {
    // Still clear cookies and redirect so user can get unstuck
  }

  // Clear org cookie so next login gets a clean state
  response.cookies.set('active_org_id', '', { path: '/', maxAge: 0 });
  return response;
}
