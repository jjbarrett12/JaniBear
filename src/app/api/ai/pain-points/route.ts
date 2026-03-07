import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireApiOrg } from '@/lib/api-guard';
import { logError } from '@/lib/observability';

/**
 * Extract customer pain points and summary from a walk-through transcript.
 * Used to capture concerns and priorities from sales walk-throughs.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;
    const body = await request.json().catch(() => ({}));
    const transcriptText = body?.transcript ?? body?.text ?? '';

    if (!transcriptText || typeof transcriptText !== 'string') {
      return NextResponse.json(
        { error: 'Missing transcript or text in request body' },
        { status: 400 }
      );
    }

    const aiService = await getAIService(orgId);
    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured. Set OPENAI_API_KEY or configure AI in admin settings.' },
        { status: 503 }
      );
    }

    const result = await aiService.extractPainPoints(transcriptText);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logError({ message: 'AI pain points failed', domain: 'ai', error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract pain points' },
      { status: 500 }
    );
  }
}
