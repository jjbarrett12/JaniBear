import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireApiOrg } from '@/lib/api-guard';
import { logError } from '@/lib/observability';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;

    const body = await request.json();
    const { type, title, description } = body;

    const aiService = await getAIService(orgId);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const suggestions = await aiService.suggestComplianceActions({
      type,
      description: description || title,
      dueDate: undefined,
      location: undefined,
    });

    return NextResponse.json({ suggestions });
  } catch (error: unknown) {
    logError({ message: 'AI compliance suggestions failed', domain: 'ai', error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
