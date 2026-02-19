import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * POST /api/admin/users/reset-password
 * Send password reset email to the user (Supabase Auth recover flow).
 * Allowed: platform admin OR tenant admin for a user in their org.
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email) {
    return NextResponse.json({ error: 'Body must include email' }, { status: 400 });
  }

  const supabase = await createClient();
  const activeOrgId = await getActiveOrgId();
  if (!access.isPlatformAdmin) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const admin = createAdminClient();
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { data: mem } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', activeOrgId ?? '')
      .maybeSingle();
    if (!mem) {
      return NextResponse.json({ error: 'User is not in your organization' }, { status: 403 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const redirectTo = typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/auth/reset-password`
    : undefined;
  const res = await fetch(`${supabaseUrl}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`,
    },
    body: JSON.stringify({ email, options: { emailRedirectTo: redirectTo } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { msg?: string }).msg ?? 'Failed to send reset email' },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, message: 'Reset email sent if the account exists' });
}

async function getActiveOrgId(): Promise<string | null> {
  const { getActiveOrgIdFromCookie } = await import('@/lib/user-context');
  return getActiveOrgIdFromCookie();
}
