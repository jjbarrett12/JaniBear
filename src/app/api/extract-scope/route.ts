import { NextResponse } from 'next/server';
import { extractScope } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { walkthrough_id } = await req.json();
    const supabase = await createClient();
    
    // Get transcript
    const { data: transcript } = await supabase
      .from('walkthrough_transcripts')
      .select('text, org_id')
      .eq('walkthrough_id', walkthrough_id)
      .single();

    if (!transcript) return new NextResponse('Transcript not found', { status: 404 });

    const result = await extractScope(transcript.text);

    // Save scope model
    await supabase.from('scope_models').insert({
      walkthrough_id,
      org_id: transcript.org_id,
      extracted_json: result.scope_json,
      confidence: result.confidence,
      missing_fields: result.missing_fields
    });

    return NextResponse.json(result);
  } catch (error) {
    return new NextResponse('Internal Error', { status: 500 });
  }
}
