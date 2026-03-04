import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getWorkOrders, createWorkOrder, getWorkOrderStats } from '@/lib/work-orders';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view === 'stats') {
    const stats = await getWorkOrderStats(guard.context.activeOrgId!);
    return NextResponse.json(stats);
  }

  const filters = {
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    facility_id: searchParams.get('facility_id') ?? undefined,
    assigned_to: searchParams.get('assigned_to') ?? undefined,
  };

  const workOrders = await getWorkOrders(guard.context.activeOrgId!, filters);
  return NextResponse.json(workOrders);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const workOrder = await createWorkOrder(
    guard.context.activeOrgId!,
    body,
    guard.context.userId
  );

  return NextResponse.json(workOrder, { status: 201 });
}
