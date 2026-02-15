import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch {
    // If middleware throws (e.g. Edge runtime, Supabase), pass through so the app can render
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    // Run middleware for protected routes only; skip auth, onboarding, api, static assets
    '/((?!_next/static|_next/image|favicon.ico|auth|onboarding|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
