import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes - never run auth middleware so /api/health etc. always work)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, manifest.json, sw.js (static assets)
     * - images (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api/|_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
