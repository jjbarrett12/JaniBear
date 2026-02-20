import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireOperatorOrg } from '@/lib/api-guard';

/**
 * Operator-only. Suggests staffing review based on outcome metrics only.
 * Never recommends specific hire/fire actions or individual performance.
 * Per JANIBEAR_OS: franchisors must not have access to labor-control AI.
 */
export async function POST(request: NextRequest) {
  try {
    const guard = await requireOperatorOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;
    const body = await request.json().catch(() => ({}));
    const {
      coverage_notes,
      quality_trend,
      open_shifts_count,
      turnover_notes,
      total_locations,
      total_crew_count,
    } = body;

    const aiService = await getAIService(orgId);
    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured. Set OPENAI_API_KEY or configure AI in admin settings.' },
        { status: 503 }
      );
    }

    const prompt = `You are an operations advisor for a janitorial company. Based ONLY on the following outcome-level metrics (no individual names or performance), provide a short "suggested staffing review" narrative.

Rules:
- Use only "suggest", "consider", "recommend" — never "must", "require", "fire", "hire [name]", or discipline.
- Do not reference any individual employee or name.
- Focus on: coverage gaps, workload balance, and whether headcount appears aligned with demand.
- Keep the response to 2–4 short sentences.

Metrics provided:
- Coverage / capacity notes: ${coverage_notes ?? 'Not provided'}
- Quality trend (e.g. inspection scores): ${quality_trend ?? 'Not provided'}
- Open shifts (unfilled): ${open_shifts_count ?? 'Not provided'}
- Turnover notes: ${turnover_notes ?? 'Not provided'}
- Total locations served: ${total_locations ?? 'Not provided'}
- Total crew count: ${total_crew_count ?? 'Not provided'}

Return valid JSON only: { "suggestion": "your narrative here", "focus_areas": ["topic1", "topic2"] }`;

    const response = await aiService.generateText({
      prompt,
      feature: 'general',
    });

    try {
      const raw = response.replace(/^```\w*\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        suggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : response,
        focus_areas: Array.isArray(parsed.focus_areas) ? parsed.focus_areas : [],
      });
    } catch {
      return NextResponse.json({
        suggestion: response,
        focus_areas: [],
      });
    }
  } catch (error: unknown) {
    console.error('AI staffing suggestions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
