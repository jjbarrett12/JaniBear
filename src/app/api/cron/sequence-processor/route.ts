import { NextRequest, NextResponse } from 'next/server';
import { processSequenceSteps } from '@/lib/marketing-automation';
import { logError } from '@/lib/observability';

/**
 * GET/POST /api/cron/sequence-processor
 *
 * Run every 15–30 minutes to process due email sequence steps:
 * sends emails, advances enrollments, marks completed.
 *
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runSequenceCron(request);
}

export async function POST(request: NextRequest) {
  return runSequenceCron(request);
}

async function runSequenceCron(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processSequenceSteps();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logError({ message: 'sequence-processor cron failed', domain: 'cron', meta: { job_name: 'sequence-processor' }, error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
