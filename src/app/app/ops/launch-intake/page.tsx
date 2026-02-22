import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { LaunchIntakeList } from '@/components/launch/launch-intake-list';

export default async function LaunchIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ highlight?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { highlight } = await searchParams;

  const { data: packets } = await supabase
    .from('launch_packets')
    .select('id, account_id, status, created_at, ready_at, payload_jsonb')
    .eq('org_id', org.org_id)
    .in('status', ['ready', 'sent_to_ops'])
    .order('ready_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const queue = (packets ?? []) as {
    id: string;
    account_id: string;
    status: string;
    ready_at: string | null;
    created_at: string;
    payload_jsonb?: Record<string, unknown> | null;
  }[];
  const accountIds = [...new Set(queue.map((p) => p.account_id).filter(Boolean))];
  const { data: accounts } = accountIds.length ? await supabase.from('accounts').select('id, name').in('id', accountIds) : { data: [] };
  const accountName = new Map((accounts ?? []).map((a) => [a.id, a.name]));

  const items = queue.map((p) => {
    const payload = (p.payload_jsonb ?? {}) as { scope?: unknown; schedule_draft?: unknown; supplies?: unknown; contacts?: unknown[] };
    const missing: string[] = [];
    if (!payload.scope) missing.push('scope');
    if (!payload.schedule_draft) missing.push('schedule');
    if (!payload.supplies) missing.push('supplies');
    if (!(Array.isArray(payload.contacts) && payload.contacts.length > 0)) missing.push('contacts');
    return {
      id: p.id,
      accountId: p.account_id,
      accountName: accountName.get(p.account_id) ?? '—',
      status: p.status,
      readyAt: p.ready_at,
      createdAt: p.created_at,
      missingItems: missing,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Launch Intake
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review Launch Packets from Sales. Accept to activate the account and create schedules; Request Changes to send back with a reason.
        </p>
      </div>

      <LaunchIntakeList items={items} highlightId={highlight ?? undefined} />
    </div>
  );
}
