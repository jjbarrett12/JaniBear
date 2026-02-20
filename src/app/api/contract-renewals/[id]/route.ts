import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { updateRenewalStatus } from '@/lib/contract-renewals';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();

  if (!body.renewal_status) {
    return NextResponse.json({ error: 'renewal_status is required' }, { status: 400 });
  }

  await updateRenewalStatus(id, body.renewal_status, body);
  return NextResponse.json({ ok: true });
}
