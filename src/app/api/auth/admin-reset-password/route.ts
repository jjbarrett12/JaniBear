import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Dev/admin only: set a user's password by email using the service role.
 * Use from browser console when reset-email flow isn't working.
 *
 * Allowed when:
 * - NODE_ENV === 'development' (e.g. localhost), or
 * - Request header x-admin-reset-secret matches JANIBEAR_ADMIN_RESET_SECRET (set in Vercel for one-off recovery).
 *
 * Body: { "email": "user@example.com", "newPassword": "NewSecurePassword123!" }
 *
 * Console example (dev):
 *   fetch('/api/auth/admin-reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'you@example.com', newPassword: 'YourNewPassword123!' }) }).then(r => r.json()).then(console.log)
 *
 * Production: add header: { 'x-admin-reset-secret': 'YOUR_SECRET' } (from env JANIBEAR_ADMIN_RESET_SECRET).
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const secret = process.env.JANIBEAR_ADMIN_RESET_SECRET;
  const headerSecret = request.headers.get('x-admin-reset-secret');
  const allowed = isDev || (secret && secret.length > 0 && headerSecret === secret);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Not allowed. Use in development or set x-admin-reset-secret.' },
      { status: 403 }
    );
  }

  let body: { email?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (!email || !newPassword) {
    return NextResponse.json(
      { error: 'Body must include "email" and "newPassword".' },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 500 });
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: `No user found with email "${email}". Check Supabase Dashboard → Authentication → Users.` },
        { status: 404 }
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Password updated for ${email}. You can sign in with the new password.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
