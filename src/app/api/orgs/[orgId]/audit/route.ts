import { NextRequest, NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';

/**
 * GET /api/orgs/[orgId]/audit — List audit log (org.manage_users).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
  const offset = Number(searchParams.get('offset')) || 0;

  const { data: rows, error } = await auth.supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, actor_user_id, before_state, after_state, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ audit: rows ?? [] });
}
