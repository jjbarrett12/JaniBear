import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { parseSpreadsheetFull } from '@/lib/onboarding-import/parse';
import { runImport } from '@/lib/onboarding-import/run';
import { normalizeHeader } from '@/lib/onboarding-import/normalize';
import { recordOnboardingEvent } from '@/lib/onboarding/recordOnboardingEvent';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/run
 * Body: { batchId: string, mapping: Record<field, normalizedColumnName> }
 * Downloads file from storage, parses full, runs import, records batch_items.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await requireImportPermission();
    const body = await request.json();
    const batchId = body?.batchId as string | undefined;
    const mapping = body?.mapping as Record<string, string> | undefined;
    const includeRowIndices = body?.includeRowIndices as number[] | undefined;
    if (!batchId || !mapping || typeof mapping !== 'object') {
      return NextResponse.json({ error: 'batchId and mapping required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: batch, error: batchErr } = await supabase
      .from('import_batches')
      .select('id, org_id, file_path, status')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (batchErr || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    if ((batch as { status: string }).status !== 'uploaded' && (batch as { status: string }).status !== 'mapped') {
      return NextResponse.json({ error: 'Batch already run or invalid state' }, { status: 400 });
    }

    const filePath = (batch as { file_path: string | null }).file_path;
    if (!filePath) return NextResponse.json({ error: 'No file for batch' }, { status: 400 });

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('onboarding-imports')
      .download(filePath);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = filePath.split('.').pop() ?? 'csv';
    const { rows } = parseSpreadsheetFull(buffer, `source.${ext}`);

    const normalizedMapping: Record<string, string> = {};
    for (const [field, col] of Object.entries(mapping)) {
      if (col) normalizedMapping[field] = normalizeHeader(col);
    }

    const result = await runImport({
      supabase,
      orgId,
      batchId,
      rows,
      mapping: normalizedMapping,
      includeRowIndices: Array.isArray(includeRowIndices) ? includeRowIndices : undefined,
    });

    await recordOnboardingEvent(supabase, orgId, 'import_completed', {
      batchId,
      accountsCreated: result.accountsCreated,
      facilitiesCreated: result.facilitiesCreated,
      crewsCreated: result.crewsCreated,
    }, userId);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Import failed' },
      { status: 500 }
    );
  }
}
