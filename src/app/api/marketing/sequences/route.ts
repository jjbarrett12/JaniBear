import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getSequences, createSequence } from '@/lib/marketing-automation';

export async function GET() {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const sequences = await getSequences(guard.context.activeOrgId!);
  return NextResponse.json(sequences);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const sequence = await createSequence(guard.context.activeOrgId!, {
    ...body,
    created_by: guard.context.userId,
  });

  return NextResponse.json(sequence, { status: 201 });
}
