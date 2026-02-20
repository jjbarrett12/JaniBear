import { NextResponse } from 'next/server';
import { extractScope } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { requireApiOrg } from '@/lib/api-guard';
import { requireFeature, guardToResponse } from '@/lib/access';

export async function POST(req: Request) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;
    const featureGuard = await requireFeature('lidar');
    if (!featureGuard.ok) return guardToResponse(featureGuard);

    const body = await req.json().catch(() => ({}));
    const walkthrough_id = body?.walkthrough_id ?? null;
    if (!walkthrough_id) {
      return NextResponse.json({ error: 'walkthrough_id required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: transcript } = await supabase
      .from('walkthrough_transcripts')
      .select('text, org_id')
      .eq('walkthrough_id', walkthrough_id)
      .single();

    if (!transcript) return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
    if (transcript.org_id !== guard.context.activeOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await extractScope(transcript.text, guard.context.activeOrgId ?? undefined);

    await supabase.from('scope_models').insert({
      walkthrough_id,
      org_id: transcript.org_id,
      extracted_json: result.scope_json,
      confidence: result.confidence,
      missing_fields: result.missing_fields
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('extract-scope error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
