import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import type { ServiceDeploymentRow } from '@/lib/service-deployments/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_deployments')
      .select(`
        id, org_id, account_id, deployment_type, reason, requested_by, requested_at, stage,
        assigned_crew_id, facility_id, notes, go_live_checklist, stabilization_metrics, created_at, updated_at,
        accounts(name),
        crews:assigned_crew_id(name),
        profiles:requested_by(full_name)
      `)
      .eq('org_id', orgId)
      .order('requested_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      account: (row.accounts as { name: string } | null) ?? null,
      assigned_crew: (row.crews as { name: string } | null) ?? null,
      requested_by_profile: (row.profiles as { full_name: string | null } | null) ?? null,
      accounts: undefined,
      crews: undefined,
      profiles: undefined,
    })) as ServiceDeploymentRow[];

    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to list deployments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.write' });

    const body = await request.json();
    const { account_id, deployment_type, reason, facility_id } = body as {
      account_id: string;
      deployment_type: string;
      reason?: string;
      facility_id?: string;
    };
    if (!account_id || !deployment_type) {
      return NextResponse.json({ error: 'account_id and deployment_type required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('service_deployments')
      .insert({
        org_id: orgId,
        account_id,
        deployment_type,
        reason: reason ?? null,
        requested_by: userId,
        facility_id: facility_id ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to create deployment' }, { status: 500 });
  }
}
