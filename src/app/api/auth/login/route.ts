/**
 * Password login — see project root AUTH_FLOW.md.
 * Form POST only; session cookies set on same response as redirect.
 */
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;

  const baseUrl = request.nextUrl.origin;
  const loginErrorUrl = new URL('/auth/login', baseUrl);

  if (!email || !password) {
    loginErrorUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(loginErrorUrl);
  }

  const successRedirect = NextResponse.redirect(new URL('/api/auth/landing', baseUrl));

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
            successRedirect.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginErrorUrl.searchParams.set('error', 'invalid');
    if (error.message.includes('Email not confirmed')) {
      loginErrorUrl.searchParams.set('error', 'unconfirmed');
    }
    return NextResponse.redirect(loginErrorUrl);
  }

  if (!data.user) {
    loginErrorUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(loginErrorUrl);
  }

  return successRedirect;
}
