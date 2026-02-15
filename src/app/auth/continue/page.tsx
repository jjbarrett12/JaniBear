import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AuthContinueClient } from './auth-continue-client';

const ALLOWED_PATHS = ['/app/', '/onboarding', '/auth/'];
const DEFAULT_NEXT = '/app/dashboard';

function getValidNext(next: string | undefined): string {
  if (!next) return DEFAULT_NEXT;
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
