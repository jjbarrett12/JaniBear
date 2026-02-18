import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateWeeklyScoreboard } from '@/lib/salesPulse/generate-weekly';
import { sendWeeklyScoreboard } from '@/lib/salesPulse/send-pulse';

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.SALES_PULSE_CRON_SECRET;

/**
 * Cron endpoint: weekly scoreboard for all orgs with sales activity.
 * Call with: Authorization: Bearer <CRON_SECRET> or x-cron-secret: <CRON_SECRET>
 * Schedule: weekly (e.g. Monday 6:00 UTC).
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

  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + diff - 7);
  const weekStart = monday.toISOString().slice(0, 10);

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
      const payload = await generateWeeklyScoreboard(orgId, weekStart);
      const { sent, failed } = await sendWeeklyScoreboard(payload);
      results.push({ orgId, sent, failed });
    } catch (e) {
      results.push({ orgId, sent: 0, failed: [(e as Error).message] });
    }
  }

  return NextResponse.json({ weekStart, results });
}
