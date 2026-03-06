import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import type { DeploymentWithDetails } from '@/lib/service-deployments/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { id } = await params;
    const supabase = await createClient();

    const { data: deployment, error: deploymentError } = await supabase
      .from('service_deployments')
      .select(`
        *,
        accounts(name),
        crews:assigned_crew_id(name),
        profiles:requested_by(full_name)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single();

    if (deploymentError || !deployment) {
      return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    }

    const { data: events } = await supabase
      .from('deployment_events')
      .select('*')
      .eq('deployment_id', id)
      .order('created_at', { ascending: false });

    const { accounts, crews, profiles, ...rest } = deployment as Record<string, unknown>;
    const result: DeploymentWithDetails = {
      ...rest,
      account_name: (accounts as { name: string } | null)?.name ?? 'Unknown',
      assigned_crew_name: (crews as { name: string } | null)?.name ?? null,
      requested_by_name: (profiles as { full_name: string | null } | null)?.full_name ?? null,
      events: (events ?? []) as DeploymentWithDetails['events'],
    } as DeploymentWithDetails;

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to fetch deployment' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.write' });

    const { id } = await params;
    const body = await request.json();
    const { stage, assigned_crew_id, notes, go_live_checklist, stabilization_metrics } = body as {
      stage?: string;
      assigned_crew_id?: string | null;
      notes?: string | null;
      go_live_checklist?: unknown;
      stabilization_metrics?: unknown;
    };

    const supabase = await createClient();

    if (stage) {
      const { data: existing } = await supabase
        .from('service_deployments')
        .select('stage')
        .eq('id', id)
        .eq('org_id', orgId)
        .single();

      if (existing) {
        await supabase.from('deployment_events').insert({
          deployment_id: id,
          from_stage: existing.stage,
          to_stage: stage,
          created_by: userId,
        });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (stage !== undefined) updates.stage = stage;
    if (assigned_crew_id !== undefined) updates.assigned_crew_id = assigned_crew_id;
    if (notes !== undefined) updates.notes = notes;
    if (go_live_checklist !== undefined) updates.go_live_checklist = go_live_checklist;
    if (stabilization_metrics !== undefined) updates.stabilization_metrics = stabilization_metrics;

    const { data, error } = await supabase
      .from('service_deployments')
      .update(updates)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to update deployment' }, { status: 500 });
  }
}
