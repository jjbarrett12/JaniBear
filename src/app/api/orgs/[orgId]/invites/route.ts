import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';

const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([...ASSIGNABLE_ROLES, 'owner']),
});

/**
 * GET /api/orgs/[orgId]/invites — List pending invites (org.manage_users).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const { data: invites, error } = await auth.supabase
    .from('org_invites')
    .select('id, email, role, expires_at, created_at, accepted_at')
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: invites ?? [] });
}

/**
 * POST /api/orgs/[orgId]/invites — Create invite (org.manage_users).
 * Only owner can invite as owner (DB trigger).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CreateInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token =
    crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error } = await auth.supabase.from('org_invites').insert({
    org_id: orgId,
    email: parsed.data.email.trim().toLowerCase(),
    role: parsed.data.role,
    token,
    expires_at: expiresAt.toISOString(),
    invited_by: auth.userId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inviteLink = `${base.replace(/\/$/, '')}/app/join-org?token=${encodeURIComponent(token)}`;

  return NextResponse.json({ invite_link: inviteLink, expires_at: expiresAt.toISOString() });
}
