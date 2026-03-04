import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getSequenceWithSteps, getSequenceStats } from '@/lib/marketing-automation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const { searchParams } = new URL(request.url);

  if (searchParams.get('view') === 'stats') {
    const stats = await getSequenceStats(id);
    return NextResponse.json(stats);
  }

  const sequence = await getSequenceWithSteps(id);
  if (!sequence) {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }

  return NextResponse.json(sequence);
}
