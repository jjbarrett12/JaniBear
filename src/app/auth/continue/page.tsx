import { redirect } from 'next/navigation';
import { getUserOrNull } from '@/lib/supabase/server';
import { AuthContinueClient } from './auth-continue-client';

const ALLOWED_PATHS = ['/app/', '/onboarding', '/auth/', '/api/auth/landing'];
const DEFAULT_NEXT = '/app/dashboard';
const DEBUG_AUTH = process.env.NODE_ENV === 'development' && (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.DEBUG_AUTH === '1');

type ContinueSearchParams = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

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
  searchParams?: ContinueSearchParams;
}) {
  const next = getValidNext(asString(searchParams?.next));

  const user = await getUserOrNull();
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
