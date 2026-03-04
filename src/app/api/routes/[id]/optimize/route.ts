import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { optimizeRoute } from '@/lib/route-optimization';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  try {
    const optimized = await optimizeRoute(id);
    return NextResponse.json(optimized);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Optimization failed' },
      { status: 400 }
    );
  }
}
