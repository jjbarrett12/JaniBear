import { NextRequest, NextResponse } from 'next/server';
import { getAIService } from '@/lib/ai/openai-service';
import { requireApiOrg } from '@/lib/api-guard';
import { logError } from '@/lib/observability';

export async function POST(request: NextRequest) {
  try {
    const guard = await requireApiOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productName = formData.get('product_name') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const aiService = await getAIService(orgId);

    if (!aiService) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Read PDF as text (simplified - in production, use pdf-parse or similar)
    // For now, we'll extract text from the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Simple text extraction (in production, use a proper PDF parser)
    // This is a placeholder - actual implementation would use pdf-parse
    const textContent = `Product: ${productName}\n[PDF content would be extracted here]`;

    const analysis = await aiService.analyzeSDS(textContent);

    return NextResponse.json(analysis);
  } catch (error: unknown) {
    logError({ message: 'AI SDS analysis failed', domain: 'ai', error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze SDS' },
      { status: 500 }
    );
  }
}
