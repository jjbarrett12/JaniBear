import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getWorkOrder, updateWorkOrderStatus } from '@/lib/work-orders';
import { workOrderPatchBody } from '@/lib/api-validation';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const orgId = guard.context.activeOrgId!;
  const workOrder = await getWorkOrder(id, orgId);
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
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = workOrderPatchBody.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const body = parsed.data;
  const orgId = guard.context.activeOrgId!;
  if (body.status) {
    await updateWorkOrderStatus(id, orgId, body.status, guard.context.userId);
  }

  const updated = await getWorkOrder(id, orgId);
  return NextResponse.json(updated);
}
