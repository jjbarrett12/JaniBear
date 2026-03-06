import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { parseSpreadsheetFull } from '@/lib/onboarding-import/parse';
import { runMigrationAudit } from '@/lib/onboarding-import/audit';
import { normalizeHeader } from '@/lib/onboarding-import/normalize';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/audit
 * Body: { batchId: string }
 * Loads batch (mapping), parses full file, runs audit. Returns summary + issues + readiness.
 */
export async function POST(request: NextRequest) {
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
    const { rows } = parseSpreadsheetFull(buffer, `source.${ext}`);

    const rawMapping = (batch as { mapping?: Record<string, string> | null }).mapping ?? {};
    const mapping: Record<string, string> = {};
    for (const [field, col] of Object.entries(rawMapping)) {
      if (col && typeof col === 'string') mapping[field] = normalizeHeader(col);
    }

    const auditResult = runMigrationAudit(rows, mapping);

    return NextResponse.json(auditResult);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Audit failed' },
      { status: 500 }
    );
  }
}
