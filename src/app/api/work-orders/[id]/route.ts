import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getWorkOrder, updateWorkOrderStatus } from '@/lib/work-orders';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const workOrder = await getWorkOrder(id);
  if (!workOrder) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }

  return NextResponse.json(workOrder);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    await updateWorkOrderStatus(id, guard.context.activeOrgId!, body.status, guard.context.userId);
  }

  const updated = await getWorkOrder(id);
  return NextResponse.json(updated);
}
