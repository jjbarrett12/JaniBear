import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  let next = requestUrl.searchParams.get('next') ?? '/app/dashboard';

  // Validate redirect path to prevent open redirects and 404s
  // Only allow redirects to app routes or public routes
  const allowedPaths = ['/app/', '/auth/', '/onboarding', '/pricing', '/survey', '/checkout', '/demo', '/contact', '/'];
  const isValidPath = allowedPaths.some(path => next.startsWith(path));
  
  if (!isValidPath) {
    next = '/app/dashboard'; // Fallback to safe default
  }

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? requestUrl.origin;
  return NextResponse.redirect(new URL(next, baseUrl));
}
