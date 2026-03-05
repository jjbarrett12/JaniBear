import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthContinueClient } from './auth-continue-client';

const ALLOWED_PATHS = ['/app/', '/onboarding', '/auth/', '/api/auth/landing'];
const DEFAULT_NEXT = '/app/dashboard';

function getValidNext(next: string | undefined): string {
  if (!next) return DEFAULT_NEXT;
  // Allow /api/auth/landing so post-login flow can go continue → landing (cookie commit)
  if (next.startsWith('/api/auth/landing')) return next;
  const isValid = ALLOWED_PATHS.some((p) => next.startsWith(p));
  return isValid ? next : DEFAULT_NEXT;
}

export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = getValidNext(params.next);

  const supabase = await createClient();
  // Validate session so redirect works when cookies are present (e.g. after password login)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(next);
  }

  return <AuthContinueClient defaultNext={next} />;
}
