import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/onboarding/import/batch
 * Body: { batchId: string, mapping?: Record<string,string>, status?: string }
 * Updates batch mapping and/or status (e.g. status=mapped after review).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { orgId } = await requireImportPermission();
    const body = await request.json();
    const batchId = body?.batchId as string | undefined;
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.mapping != null) updates.mapping = body.mapping;
    if (body.status != null) updates.status = body.status;

    const { error } = await supabase
      .from('import_batches')
      .update(updates)
      .eq('id', batchId)
      .eq('org_id', orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}

/**
 * GET /api/onboarding/import/batch?batchId=xxx
 * Returns batch row (id, status, summary, mapping, file_path).
 */
export async function GET(request: NextRequest) {
  try {
    const { orgId } = await requireImportPermission();
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('import_batches')
      .select('id, status, summary, mapping, file_path, created_at')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
