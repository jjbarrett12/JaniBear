import { NextRequest, NextResponse } from 'next/server';
import { processRenewalReminders } from '@/lib/contract-renewals';
import { logError } from '@/lib/observability';

/**
 * GET/POST /api/cron/contract-renewals
 *
 * Run daily to scan contract renewals and send 90/60/30-day
 * notifications to assigned reps and client contacts.
 *
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runRenewalCron(request);
}

export async function POST(request: NextRequest) {
  return runRenewalCron(request);
}

async function runRenewalCron(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processRenewalReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logError({ message: 'contract-renewals cron failed', domain: 'cron', meta: { job_name: 'contract-renewals' }, error: err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
