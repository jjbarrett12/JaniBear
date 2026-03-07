import { NextRequest, NextResponse } from 'next/server';
import { processDueBillingSchedules } from '@/lib/recurring-billing';
import { startCronRun, finishCronRun } from '@/lib/observability';

/**
 * GET/POST /api/cron/recurring-billing
 *
 * Run daily to generate invoices from active recurring billing schedules
 * where next_invoice_at <= today.
 *
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runBillingCron(request);
}

export async function POST(request: NextRequest) {
  return runBillingCron(request);
}

async function runBillingCron(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startCronRun('recurring-billing');
  try {
    const result = await processDueBillingSchedules();
    await finishCronRun(runId, 'success');
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await finishCronRun(runId, 'failure', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
