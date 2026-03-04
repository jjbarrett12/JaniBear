import { NextResponse } from 'next/server';
import { requireOperatorOrg } from '@/lib/api-guard';
import { getAIService } from '@/lib/ai/openai-service';

const SYSTEM_PROMPT = `You are an expert at extracting structured data from janitorial service schedules and contracts.

Extract the following information from the document and return it as JSON:

{
  "locations": [
    {
      "name": "Building/location name",
      "address": "Full address if available",
      "square_footage": number or null,
      "service_days": ["Monday", "Wednesday", "Friday"] or description,
      "service_time": "evening" | "morning" | "afternoon" | "overnight",
      "frequency": "3x per week" or similar,
      "special_requirements": "Any notes about this location"
    }
  ],
  "total_square_footage": number or null,
  "total_visits_per_week": number,
  "summary": "Brief summary of the service schedule",
  "missing_info": ["List of information that couldn't be extracted"]
}

Be thorough but only include information that is clearly present in the document.`;

export async function POST(request: Request) {
  try {
    const guard = await requireOperatorOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;
    const body = await request.json();
    const { documentText, documentType = 'schedule' } = body;

    if (!documentText) {
      return NextResponse.json(
        { error: 'Missing document text' },
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

    const userPrompt = `Please extract the service schedule information from this ${documentType}:\n\n${documentText}`;
    const extractedData = await aiService.generateJson(SYSTEM_PROMPT, userPrompt, { temperature: 0.3 });

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Schedule scan error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
