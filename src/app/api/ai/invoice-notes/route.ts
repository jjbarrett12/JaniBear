import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireApiOrg } from '@/lib/api-guard';
import { logError } from '@/lib/observability';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const body = await request.json().catch(() => ({}));
    const { items = [], total, customer } = body ?? {};

    const aiService = await getAIService(guard.context.activeOrgId!);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const notes = await aiService.generateInvoiceNotes({
      customer: customer || 'Customer',
      items: (Array.isArray(items) ? items : []).map((item: any) => ({
        description: item.description,
        quantity: parseFloat(item.quantity || '0'),
        price: parseFloat(item.unit_price || '0'),
      })),
      total: total || 0,
    });

    return NextResponse.json({ notes });
  } catch (error: unknown) {
    logError({ message: 'AI invoice notes failed', domain: 'ai', error });
    const message = error instanceof Error ? error.message : 'Failed to generate notes';
    const isTimeout = typeof message === 'string' && (message.includes('timeout') || message.includes('ETIMEDOUT'));
    return NextResponse.json(
      { error: isTimeout ? 'AI request timed out. Please try again.' : message },
      { status: isTimeout ? 503 : 500 }
    );
  }
}
