import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { sendSurveyInvite, sendSurveyToAccounts } from '@/lib/customer-surveys';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await request.json();

  if (body.account_ids && Array.isArray(body.account_ids)) {
    const result = await sendSurveyToAccounts(guard.context.activeOrgId!, id, body.account_ids);
    return NextResponse.json(result);
  }

  if (body.email) {
    const token = await sendSurveyInvite(
      guard.context.activeOrgId!,
      id,
      body.email,
      body.name ?? null,
      body.account_id,
      body.facility_id
    );
    return NextResponse.json({ token }, { status: 201 });
  }

  return NextResponse.json({ error: 'Provide email or account_ids' }, { status: 400 });
}
