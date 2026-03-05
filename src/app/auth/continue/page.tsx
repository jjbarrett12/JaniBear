import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthContinueClient } from './auth-continue-client';

const ALLOWED_PATHS = ['/app/', '/onboarding', '/auth/', '/api/auth/landing'];
const DEFAULT_NEXT = '/app/dashboard';
const DEBUG_AUTH = process.env.NODE_ENV === 'development' && (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.DEBUG_AUTH === '1');

function getValidNext(next: string | undefined): string {
  if (!next) return DEFAULT_NEXT;
  if (next.startsWith('/api/auth/landing')) return next;
  const isValid = ALLOWED_PATHS.some((p) => next.startsWith(p));
  return isValid ? next : DEFAULT_NEXT;
}

/**
 * Post-login intermediate page. When next is an API route (e.g. /api/auth/landing),
 * always render client so the browser commits Set-Cookie before navigating.
 * Only server-redirect when next is a page route and user exists.
 */
export const dynamic = 'force-dynamic';

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = getValidNext(params.next);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (DEBUG_AUTH) {
    console.log('[AUTH_DEBUG] /auth/continue', { hasUser: !!user, next });
  }
  // If next is any API route, never server-redirect: client must navigate so cookies are committed.
  if (next.startsWith('/api/')) {
    return <AuthContinueClient defaultNext={next} />;
  }
  if (user) {
    redirect(next);
  }

  return <AuthContinueClient defaultNext={next} />;
}
