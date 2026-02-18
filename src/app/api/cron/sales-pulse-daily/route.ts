import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDailyPulse } from '@/lib/salesPulse/generate-daily';
import { sendDailyPulse } from '@/lib/salesPulse/send-pulse';

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.SALES_PULSE_CRON_SECRET;

/**
 * Cron endpoint: daily sales pulse for all orgs with sales_targets or sales_proposals.
 * Call with: Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>
 * Schedule: daily after midnight (e.g. 6:00 UTC).
 */
export async function GET(request: Request) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
  }
  const authHeader = request.headers.get('authorization');
  const secretHeader = request.headers.get('x-cron-secret');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : secretHeader ?? '';
  if (token !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().slice(0, 10);

  const supabase = createAdminClient();
  const { data: orgs } = await supabase
    .from('sales_proposals')
    .select('org_id')
    .not('org_id', 'is', null);
  const orgIds = [...new Set((orgs ?? []).map((o) => o.org_id))];
  const { data: targetOrgs } = await supabase.from('sales_targets').select('org_id');
  targetOrgs?.forEach((o) => orgIds.push(o.org_id));
  const uniqueOrgIds = [...new Set(orgIds)];

  const results: { orgId: string; sent: number; failed: string[] }[] = [];
  for (const orgId of uniqueOrgIds) {
    try {
      const payload = await generateDailyPulse(orgId, date);
      const { sent, failed } = await sendDailyPulse(payload);
      results.push({ orgId, sent, failed });
    } catch (e) {
      results.push({ orgId, sent: 0, failed: [(e as Error).message] });
    }
  }

  return NextResponse.json({ date, results });
}
