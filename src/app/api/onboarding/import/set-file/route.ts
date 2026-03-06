import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { recordOnboardingEvent } from '@/lib/onboarding/recordOnboardingEvent';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/set-file
 * Body: { batchId: string, filePath: string }
 * Updates import_batches.file_path after client uploads to storage.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await requireImportPermission();
    const body = await request.json();
    const batchId = body?.batchId as string | undefined;
    const filePath = body?.filePath as string | undefined;
    if (!batchId || !filePath) {
      return NextResponse.json({ error: 'batchId and filePath required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('import_batches')
      .update({ file_path: filePath, updated_at: new Date().toISOString() })
      .eq('id', batchId)
      .eq('org_id', orgId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordOnboardingEvent(supabase, orgId, 'file_uploaded', { batchId, filePath }, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
