import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getRenewals, createRenewal, getRenewalPipeline } from '@/lib/contract-renewals';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);

  if (searchParams.get('view') === 'pipeline') {
    const pipeline = await getRenewalPipeline(guard.context.activeOrgId!);
    return NextResponse.json(pipeline);
  }

  const filters = {
    status: searchParams.get('status') ?? undefined,
    assigned_to: searchParams.get('assigned_to') ?? undefined,
  };

  const renewals = await getRenewals(guard.context.activeOrgId!, filters);
  return NextResponse.json(renewals);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const renewal = await createRenewal(guard.context.activeOrgId!, body);
  return NextResponse.json(renewal, { status: 201 });
}
