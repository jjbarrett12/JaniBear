import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { parseSpreadsheet } from '@/lib/onboarding-import/parse';
import { recordOnboardingEvent } from '@/lib/onboarding/recordOnboardingEvent';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/parse
 * Body: { batchId: string } — reads file from storage for this batch, parses, returns sample + columns.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await requireImportPermission();
    const body = await request.json();
    const batchId = body?.batchId as string | undefined;
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const { data: batch, error: batchErr } = await supabase
      .from('import_batches')
      .select('id, org_id, file_path, status')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (batchErr || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const filePath = (batch as { file_path: string | null }).file_path;
    if (!filePath) return NextResponse.json({ error: 'No file uploaded for this batch' }, { status: 400 });

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('onboarding-imports')
      .download(filePath);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = filePath.split('.').pop() ?? 'csv';
    const filename = `source.${ext}`;
    const result = parseSpreadsheet(buffer, filename);

    await recordOnboardingEvent(supabase, orgId, 'file_parsed', { batchId, rowCount: result.rowCount }, userId);

    return NextResponse.json({
      sampleRows: result.rows,
      columns: result.columns,
      normalizedColumns: result.normalizedColumns,
      rowCount: result.rowCount,
      sampleSize: result.sampleSize,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    );
  }
}
