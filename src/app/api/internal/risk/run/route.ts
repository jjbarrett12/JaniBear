import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAccountRiskForOrg } from '@/lib/risk/runAccountRisk';

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.INTERNAL_CRON_SECRET;

/**
 * POST /api/internal/risk/run
 * Body: { orgId?: string, accountId?: string }
 * Header: x-internal-cron-secret
 * If accountId: recompute one account. Else iterate all accounts for org (or all orgs if no orgId).
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-cron-secret') ?? request.headers.get('authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { orgId?: string; accountId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const supabase = createAdminClient();

  if (body.accountId && body.orgId) {
    const { processed, events } = await runAccountRiskForOrg({
      orgId: body.orgId,
      accountId: body.accountId,
      supabase,
    });
    return NextResponse.json({ ok: true, processed, events });
  }

  if (body.orgId) {
    const { processed, events } = await runAccountRiskForOrg({
      orgId: body.orgId,
      supabase,
    });
    return NextResponse.json({ ok: true, processed, events });
  }

  const { data: orgs } = await supabase.from('organizations').select('id');
  const orgIds = (orgs ?? []).map((o: { id: string }) => o.id);
  let totalProcessed = 0;
  let totalEvents = 0;
  for (const orgId of orgIds) {
    const { processed, events } = await runAccountRiskForOrg({ orgId, supabase });
    totalProcessed += processed;
    totalEvents += events;
  }
  return NextResponse.json({ ok: true, processed: totalProcessed, events: totalEvents, orgs: orgIds.length });
}
