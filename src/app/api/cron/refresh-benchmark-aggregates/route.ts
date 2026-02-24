import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET/POST /api/cron/refresh-benchmark-aggregates
 *
 * Recomputes public.benchmark_aggregates from opted-in orgs only.
 * No raw org data is returned or exposed; aggregation runs in DB (refresh_benchmark_aggregates).
 *
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runRefresh(request);
}

export async function POST(request: NextRequest) {
  return runRefresh(request);
}

async function runRefresh(request: NextRequest) {
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
    const [anonResult, codeResult] = await Promise.all([
      supabase.rpc('refresh_benchmark_aggregates'),
      supabase.rpc('refresh_benchmark_code_aggregates'),
    ]);

    if (anonResult.error) {
      return NextResponse.json({ error: anonResult.error.message }, { status: 500 });
    }
    if (codeResult.error) {
      return NextResponse.json({ error: codeResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      anonymousRowsUpdated: anonResult.data ?? 0,
      codeRowsUpdated: codeResult.data ?? 0,
    });
  } catch (err) {
    console.error('cron/refresh-benchmark-aggregates:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
