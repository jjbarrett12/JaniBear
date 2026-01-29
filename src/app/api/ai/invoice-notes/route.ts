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
    const { items, total, customer } = body;

    const aiService = await getAIService(orgMember.org_id);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const notes = await aiService.generateInvoiceNotes({
      customer: customer || 'Customer',
      items: items.map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity || '0'),
        price: parseFloat(item.unit_price || '0'),
      })),
      total: total || 0,
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('AI invoice notes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate notes' },
      { status: 500 }
    );
  }
}
