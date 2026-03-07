import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireApiOrg } from '@/lib/api-guard';
import { logError } from '@/lib/observability';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;

    const body = await request.json();
    const { items, location } = body;

    const aiService = await getAIService(orgId);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: recentOrders } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recommendations = await aiService.recommendPOItems({
      location,
      recentOrders: recentOrders || [],
      inventory: [],
    });

    return NextResponse.json(recommendations);
  } catch (error: unknown) {
    logError({ message: 'AI PO recommendations failed', domain: 'ai', error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
