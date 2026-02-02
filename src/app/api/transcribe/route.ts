import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { walkthrough_id, audio_storage_path } = await req.json();
    
    // Validate permission (stub)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const result = await transcribeAudio(audio_storage_path);

    // Save to DB
    await supabase.from('walkthrough_transcripts').insert({
      walkthrough_id,
      text: result.text,
      segments_jsonb: result.segments,
      provider: 'openai-stub',
      org_id: (await supabase.from('walkthroughs').select('org_id').eq('id', walkthrough_id).single()).data?.org_id
    });

    return NextResponse.json(result);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
