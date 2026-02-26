import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export async function middleware(request: NextRequest) {
  try {
    const response = await updateSession(request);
    const pathname = request.nextUrl.pathname;
    const res = response instanceof NextResponse ? response : NextResponse.next({ request });
    SECURITY_HEADERS.forEach((value, key) => res.headers.set(key, value));
    return res;
  } catch (e) {
    console.error('[middleware] auth/session error', e);
    if (request.nextUrl.pathname.startsWith('/app/')) {
      const redirect = NextResponse.redirect(new URL('/auth/login', request.url));
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => redirect.headers.set(key, value));
      return redirect;
    }
    const res = NextResponse.next({ request });
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => res.headers.set(key, value));
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
