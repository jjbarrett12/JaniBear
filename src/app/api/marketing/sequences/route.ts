import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getSequences, createSequence } from '@/lib/marketing-automation';
import { marketingSequenceCreateBody } from '@/lib/api-validation';

export async function GET() {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const sequences = await getSequences(guard.context.activeOrgId!);
  return NextResponse.json(sequences);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = marketingSequenceCreateBody.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? 'Invalid body';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const sequence = await createSequence(guard.context.activeOrgId!, {
    ...parsed.data,
    created_by: guard.context.userId,
  });

  return NextResponse.json(sequence, { status: 201 });
}
