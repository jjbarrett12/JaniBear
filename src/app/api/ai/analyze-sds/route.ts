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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productName = formData.get('product_name') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const aiService = await getAIService(orgMember.org_id);

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
  } catch (error: any) {
    console.error('AI SDS analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze SDS' },
      { status: 500 }
    );
  }
}
