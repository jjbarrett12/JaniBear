import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/users/set-password
 * Set a user's password (service role). Platform superadmin only.
 * Body: { userId: string, newPassword: string }
 */
export async function POST(request: NextRequest) {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: platform admin only' }, { status: 403 });
  }

  let body: { userId?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'Body must include userId and newPassword' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
