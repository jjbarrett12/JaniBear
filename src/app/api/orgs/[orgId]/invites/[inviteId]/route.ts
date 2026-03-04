import { NextRequest, NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';

/**
 * DELETE /api/orgs/[orgId]/invites/[inviteId] — Revoke invite (org.manage_users).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; inviteId: string }> }
) {
  const { orgId, inviteId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const { data: invite } = await auth.supabase
    .from('org_invites')
    .select('id')
    .eq('id', inviteId)
    .eq('org_id', orgId)
    .is('accepted_at', null)
    .single();

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found or already accepted' }, { status: 404 });
  }

  const { error } = await auth.supabase
    .from('org_invites')
    .delete()
    .eq('id', inviteId)
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
