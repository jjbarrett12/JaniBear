import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { ASSIGNABLE_ROLES } from '@/lib/team-roles';

const UpdateMemberSchema = z.object({
  role: z.enum([...ASSIGNABLE_ROLES, 'owner']).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

/**
 * PATCH /api/orgs/[orgId]/members/[memberId] — Update role or status (org.manage_users).
 * Only owner can set role to owner (enforced by DB trigger).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  const { orgId, memberId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updates: { role?: string; status?: string } = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  const { data: existing } = await auth.supabase
    .from('org_members')
    .select('id, role')
    .eq('id', memberId)
    .eq('org_id', orgId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
  if (existing.role === 'owner' && updates.role && updates.role !== 'owner') {
    return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 });
  }

  if (updates.role === 'owner') {
    const { data: caller } = await auth.supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', auth.userId)
      .single();
    if (caller?.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only an owner can assign the owner role' },
        { status: 403 }
      );
    }
  }

  const { error } = await auth.supabase
    .from('org_members')
    .update(updates)
    .eq('id', memberId)
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/orgs/[orgId]/members/[memberId] — Remove member (org.manage_users).
 * Cannot remove the last owner.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string; memberId: string }> }
) {
  const { orgId, memberId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const { data: target } = await auth.supabase
    .from('org_members')
    .select('id, role')
    .eq('id', memberId)
    .eq('org_id', orgId)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }
  if (target.role === 'owner') {
    const { count } = await auth.supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('role', 'owner');
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 });
    }
  }

  const { error } = await auth.supabase
    .from('org_members')
    .delete()
    .eq('id', memberId)
    .eq('org_id', orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
