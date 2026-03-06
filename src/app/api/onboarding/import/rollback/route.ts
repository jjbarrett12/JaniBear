import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/rollback
 * Body: { batchId: string }
 * Deletes all rows created by this batch (using import_batch_items) in reverse order, then marks batch rolled_back.
 */
export async function POST(request: NextRequest) {
  try {
    const { orgId } = await requireImportPermission();
    const body = await request.json();
    const batchId = body?.batchId as string | undefined;
    if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

    const supabase = await createClient();
    const { data: batch, error: batchErr } = await supabase
      .from('import_batches')
      .select('id, org_id, status')
      .eq('id', batchId)
      .eq('org_id', orgId)
      .single();

    if (batchErr || !batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    const status = (batch as { status: string }).status;
    if (status !== 'done' && status !== 'failed') {
      return NextResponse.json({ error: 'Only done or failed batches can be rolled back' }, { status: 400 });
    }

    const { data: items } = await supabase
      .from('import_batch_items')
      .select('id, entity_type, entity_id')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    const list = (items ?? []) as { id: string; entity_type: string; entity_id: string }[];
    for (const item of list) {
      if (item.entity_type === 'accounts') {
        await supabase.from('accounts').delete().eq('id', item.entity_id).eq('org_id', orgId);
      } else if (item.entity_type === 'facilities') {
        await supabase.from('facilities').delete().eq('id', item.entity_id).eq('org_id', orgId);
      } else if (item.entity_type === 'crews') {
        await supabase.from('crews').delete().eq('id', item.entity_id).eq('org_id', orgId);
      }
      await supabase.from('import_batch_items').delete().eq('id', item.id);
    }

    await supabase
      .from('import_batches')
      .update({
        status: 'rolled_back',
        summary: {},
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .eq('org_id', orgId);

    return NextResponse.json({ ok: true, deleted: list.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Rollback failed' },
      { status: 500 }
    );
  }
}
