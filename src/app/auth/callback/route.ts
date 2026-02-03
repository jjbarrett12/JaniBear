import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Use origin for local dev, NEXT_PUBLIC_APP_URL for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'oauth');
    loginUrl.searchParams.set('message', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/auth/login', baseUrl));
  }

  // We'll determine the final redirect URL after checking membership
  let finalRedirectUrl = new URL('/app/dashboard', baseUrl);
  
  // Create response object - we'll set the URL later
  const response = NextResponse.redirect(finalRedirectUrl);

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
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (exchangeError) {
    console.error('Code exchange error:', exchangeError);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'session');
    return NextResponse.redirect(loginUrl);
  }

  // After successful exchange, check if user needs onboarding
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // Check if user has an org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.org_id) {
      // User needs onboarding - but we already have cookies set on response
      // Create new redirect with same cookies
      const onboardingUrl = new URL('/onboarding', baseUrl);
      const onboardingResponse = NextResponse.redirect(onboardingUrl);
      
      // Copy all cookies from original response
      response.cookies.getAll().forEach(cookie => {
        onboardingResponse.cookies.set(cookie.name, cookie.value, {
          path: '/',
          httpOnly: true,
          secure: baseUrl.startsWith('https'),
          sameSite: 'lax',
        });
      });
      
      return onboardingResponse;
    }
  }

  // User has membership, go to dashboard
  return response;
}
