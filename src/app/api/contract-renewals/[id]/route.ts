import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { updateRenewalStatus, isAllowedRenewalStatus } from '@/lib/contract-renewals';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  let body: { renewal_status?: string; [k: string]: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = typeof body?.renewal_status === 'string' ? body.renewal_status.trim() : '';
  if (!status) {
    return NextResponse.json({ error: 'renewal_status is required' }, { status: 400 });
  }
  if (!isAllowedRenewalStatus(status)) {
    return NextResponse.json(
      { error: 'renewal_status must be one of: upcoming, notified_90d, notified_60d, notified_30d, proposal_sent, negotiating, renewed, lost, expired' },
      { status: 400 }
    );
  }

  const orgId = guard.context.activeOrgId!;
  await updateRenewalStatus(id, orgId, status, body);
  return NextResponse.json({ ok: true });
}
