import { NextRequest, NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';

/**
 * POST /api/orgs/[orgId]/invites/[inviteId]/resend — Extend expiry and return new link (org.manage_users).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  const { orgId, inviteId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invite, error: updateError } = await auth.supabase
    .from('org_invites')
    .update({ expires_at: expiresAt.toISOString() })
    .eq('id', inviteId)
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .select('token')
    .single();

  if (updateError || !invite) {
    return NextResponse.json(
      { error: 'Invite not found or already accepted' },
      { status: 404 }
    );
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inviteLink = `${base.replace(/\/$/, '')}/app/join-org?token=${encodeURIComponent(invite.token)}`;

  return NextResponse.json({ invite_link: inviteLink, expires_at: expiresAt.toISOString() });
}
