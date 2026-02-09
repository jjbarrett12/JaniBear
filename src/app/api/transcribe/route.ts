import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { requireApiOrg } from '@/lib/api-guard';

export async function POST(req: Request) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => ({}));
    const { walkthrough_id, audio_storage_path } = body ?? {};
    if (!walkthrough_id || !audio_storage_path) {
      return NextResponse.json(
        { error: 'walkthrough_id and audio_storage_path required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: walkthrough } = await supabase
      .from('walkthroughs')
      .select('org_id')
      .eq('id', walkthrough_id)
      .single();

    if (!walkthrough || walkthrough.org_id !== guard.context.activeOrgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await transcribeAudio(audio_storage_path);

    await supabase.from('walkthrough_transcripts').insert({
      walkthrough_id,
      text: result.text,
      segments_jsonb: result.segments,
      provider: 'openai-stub',
      org_id: walkthrough.org_id
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('transcribe error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
