import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { recalculateOperatorScores } from '@/lib/performance/recalculateOperatorScores';
import { logError } from '@/lib/observability';

/**
 * GET/POST /api/cron/daily-operator-performance
 *
 * Nightly job: recompute operator_performance and operator_capacity for all orgs.
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runRecalc(request);
}

export async function POST(request: NextRequest) {
  return runRecalc(request);
}

async function runRecalc(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data: orgs } = await supabase.from('organizations').select('id');
    const orgIds = (orgs ?? []).map((o: { id: string }) => o.id);
    for (const orgId of orgIds) {
      await recalculateOperatorScores(orgId, supabase);
    }
    return NextResponse.json({ ok: true, orgs: orgIds.length });
  } catch (e) {
    logError({ message: 'daily-operator-performance cron failed', domain: 'cron', meta: { job_name: 'daily-operator-performance' }, error: e });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Recalc failed' },
      { status: 500 }
    );
  }
}
