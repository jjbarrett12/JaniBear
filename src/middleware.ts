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
  // Only run middleware for /app/* (protected routes). Root, /api, /pricing, etc. never hit middleware,
  // so they can't cause 404s from middleware failures.
  matcher: ['/app/:path*'],
};
