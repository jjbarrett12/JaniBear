import { NextRequest, NextResponse } from 'next/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';
import { createAdminClient } from '@/lib/supabase/admin';
import { adminUsersSetPasswordBody } from '@/lib/api-validation';

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

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = adminUsersSetPasswordBody.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { userId, newPassword } = parsed.data;

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
