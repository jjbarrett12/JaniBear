import { NextRequest, NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/api-auth';
import { PERMISSIONS } from '@/lib/permissions';

/**
 * GET /api/orgs/[orgId]/members — List org members (org.manage_users or same-org read).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const auth = await requireOrgPermission(orgId, PERMISSIONS.ORG_MANAGE_USERS);
  if (!auth.ok) return auth.response;

  const { data: members, error } = await auth.supabase
    .from('org_members')
    .select(`
      id,
      user_id,
      role,
      status,
      created_at,
      profiles:user_id ( full_name )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (members ?? []).map((m: { profiles?: { full_name?: string } | null }) => {
    const profile = m.profiles && !Array.isArray(m.profiles) ? (m.profiles as { full_name?: string }) : null;
    return {
      id: (m as { id: string }).id,
      user_id: (m as { user_id: string }).user_id,
      role: (m as { role: string }).role,
      status: (m as { status: string | null }).status,
      created_at: (m as { created_at: string }).created_at,
      name: profile?.full_name ?? null,
    };
  });

  return NextResponse.json({ members: list });
}
