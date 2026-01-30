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
  // TEMPORARY: Disable middleware for all routes to rule out 404 from middleware.
  // After 404 is fixed, restore to: matcher: ['/app/:path*']
  matcher: ['/__middleware_disabled_do_not_use'],
};
