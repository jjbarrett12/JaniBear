import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIService } from '@/lib/ai/openai-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { square_footage, flooring_breakdown, cleaning_frequency, restrooms, notes } = body;

    const aiService = await getAIService(orgMember.org_id);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured. Add an API key in Settings.' },
        { status: 503 }
      );
    }

    const suggestions = await aiService.suggestProposal({
      square_footage: Number(square_footage) || 0,
      flooring_breakdown: flooring_breakdown || [],
      cleaning_frequency: cleaning_frequency || '',
      restrooms: restrooms != null ? Number(restrooms) : undefined,
      notes: notes || '',
    });

    return NextResponse.json(suggestions);
  } catch (error: any) {
    console.error('AI proposal suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
