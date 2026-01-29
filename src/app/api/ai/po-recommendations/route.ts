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
    const { items, location } = body;

    const aiService = await getAIService(orgMember.org_id);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Get recent orders for context
    const { data: recentOrders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('org_id', orgMember.org_id)
      .order('created_at', { ascending: false })
      .limit(5);

    const recommendations = await aiService.recommendPOItems({
      location,
      recentOrders: recentOrders || [],
      inventory: [],
    });

    return NextResponse.json(recommendations);
  } catch (error: any) {
    console.error('AI PO recommendations error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
