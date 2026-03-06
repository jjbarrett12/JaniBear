import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import { recordOnboardingEvent } from '@/lib/onboarding/recordOnboardingEvent';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/create-batch
 * Creates an import_batches row (status: uploaded). Client then uploads file to storage and calls parse.
 */
export async function POST() {
  try {
    const { userId, orgId } = await requireImportPermission();
    const supabase = await createClient();

    const { data: batch, error } = await supabase
      .from('import_batches')
      .insert({
        org_id: orgId,
        created_by: userId,
        status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await recordOnboardingEvent(supabase, orgId, 'import_started', {}, userId);
    return NextResponse.json({ batchId: (batch as { id: string }).id, orgId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
