import { NextRequest, NextResponse } from 'next/server';
import { requireImportPermission } from '@/lib/onboarding-import/guard';
import {
  detectPlatform,
  getMappingTemplateForPlatform,
  type DetectablePlatform,
} from '@/lib/onboarding-import/platform-detection';

export const dynamic = 'force-dynamic';

/**
 * POST /api/onboarding/import/detect
 * Body: { columns: string[], overridePlatform?: "jobber" | "zenmaid" | "swept" | "generic_spreadsheet" }
 * Returns platform detection result and suggested mapping. If overridePlatform is set, uses that platform's template.
 */
export async function POST(request: NextRequest) {
  try {
    await requireImportPermission();
    const body = await request.json().catch(() => ({}));
    const columns = body?.columns as string[] | undefined;
    const overridePlatform = body?.overridePlatform as DetectablePlatform | undefined;
    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json({ error: 'columns array required' }, { status: 400 });
    }

    const detection = overridePlatform
      ? {
          platform: overridePlatform,
          confidence: overridePlatform === 'generic_spreadsheet' ? 0 : 1,
          matched_headers: [] as string[],
        }
      : detectPlatform(columns);

    const result: {
      platform: string;
      confidence: number;
      matched_headers: string[];
      suggested_mapping?: Record<string, string>;
    } = {
      platform: detection.platform,
      confidence: detection.confidence,
      matched_headers: detection.matched_headers,
    };

    if (detection.platform !== 'generic_spreadsheet') {
      result.suggested_mapping = getMappingTemplateForPlatform(
        detection.platform,
        columns
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Detection failed' },
      { status: 500 }
    );
  }
}
