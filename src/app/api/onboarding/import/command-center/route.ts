import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { parseSpreadsheetFull } from '@/lib/onboarding-import/parse';
import { runMigrationAudit } from '@/lib/onboarding-import/audit';
import { detectPlatform } from '@/lib/onboarding-import/platform-detection';
import { normalizeHeader } from '@/lib/onboarding-import/normalize';

export const dynamic = 'force-dynamic';

const PREVIEW_ROW_LIMIT = 50;

function getVal(row: Record<string, string>, mapping: Record<string, string>, field: string): string {
  const col = mapping[field];
  return (col ? row[col] : row[field])?.trim() ?? '';
}

/**
 * POST /api/onboarding/import/command-center
 * Body: { batchId: string }
 * Returns audit, platform detection, preview rows, and analysis timing for the Migration Command Center.
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  try {
    const { orgId } = await requireImportPermission();
    const body = await request.json().catch(() => ({}));
    const batchId = body?.batchId as string | undefined;
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const { data: batch, error: batchErr } = await supabase
      .from('import_batches')
      .select('id, org_id, file_path, mapping')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (batchErr || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

    const filePath = (batch as { file_path: string | null }).file_path;
    if (!filePath) return NextResponse.json({ error: 'No file for this batch' }, { status: 400 });

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('onboarding-imports')
      .download(filePath);

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = filePath.split('.').pop() ?? 'csv';
    const { rows, columns } = parseSpreadsheetFull(buffer, `source.${ext}`);

    const rawMapping = (batch as { mapping?: Record<string, string> | null }).mapping ?? {};
    const mapping: Record<string, string> = {};
    for (const [field, col] of Object.entries(rawMapping)) {
      if (col && typeof col === 'string') mapping[field] = normalizeHeader(col);
    }

    const audit = runMigrationAudit(rows, mapping);
    const detection = detectPlatform(columns);

    const previewRows = rows.slice(0, PREVIEW_ROW_LIMIT).map((row, index) => ({
      row_index: index,
      customer: getVal(row, mapping, 'customer_name'),
      building: getVal(row, mapping, 'building_name'),
      address: getVal(row, mapping, 'address'),
      service_schedule_raw: getVal(row, mapping, 'service_schedule_raw'),
      operator_name: getVal(row, mapping, 'operator_name'),
    }));

    const analysisDurationMs = Date.now() - start;

    return NextResponse.json({
      audit,
      detection: {
        platform: detection.platform,
        confidence: detection.confidence,
        matched_headers: detection.matched_headers,
      },
      previewRows,
      rowCount: rows.length,
      analysisDurationMs,
      mapping,
      columns,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Command center failed' },
      { status: 500 }
    );
  }
}
