import { NextResponse } from 'next/server';
import { requireOperatorOrg } from '@/lib/api-guard';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const guard = await requireOperatorOrg();
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const { documentText, documentType = 'schedule' } = body;

    if (!documentText) {
      return NextResponse.json(
        { error: 'Missing document text' },
        { status: 400 }
      );
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert at extracting structured data from janitorial service schedules and contracts.

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please extract the service schedule information from this ${documentType}:\n\n${documentText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Failed to extract data from document' },
        { status: 500 }
      );
    }

    const extractedData = JSON.parse(content);

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
