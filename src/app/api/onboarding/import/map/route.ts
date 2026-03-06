import { NextRequest, NextResponse } from 'next/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { inferMapping } from '@/lib/onboarding-import/ai-map';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/map
 * Body: { columns: string[], sampleRows: Record<string,string>[] }
 * Calls LLM to infer mapping; returns mappings, confidence, notes, needs_user_input.
 */
export async function POST(request: NextRequest) {
  try {
    await requireImportPermission();
    const body = await request.json();
    const columns = body?.columns as string[] | undefined;
    const sampleRows = (body?.sampleRows ?? body?.sample_rows) as Record<string, string>[] | undefined;

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ error: 'columns array required' }, { status: 400 });
    }
    if (!Array.isArray(sampleRows)) {
      return NextResponse.json({ error: 'sampleRows array required' }, { status: 400 });
    }

    const result = await inferMapping(columns, sampleRows);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Mapping failed' },
      { status: 500 }
    );
  }
}
