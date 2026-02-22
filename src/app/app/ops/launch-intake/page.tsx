import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function LaunchIntakePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: packets } = await supabase
    .from('launch_packets')
    .select('id, account_id, status, created_at, ready_at, sales_owner, ops_owner')
    .eq('org_id', org.org_id)
    .in('status', ['ready', 'sent_to_ops'])
    .order('ready_at', { ascending: false, nullsFirst: false })
    .limit(50);

  const queue = (packets ?? []) as { id: string; account_id: string; status: string; ready_at: string | null }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Launch Intake
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review Launch Packets from Sales. Accept to activate the account and create schedules; Reject to send back with a reason.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue (Ready / Sent to Ops)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accept Launch or Reject with reason.
          </p>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="text-muted-foreground">No packets in queue. Sales will send packets when they mark them Ready.</p>
          ) : (
            <ul className="divide-y divide-border">
              {queue.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <Link href={`/app/ops/launch-intake/${p.id}`} className="font-medium text-primary hover:underline">
                    Packet {p.id.slice(0, 8)}… — Account {p.account_id?.slice(0, 8)}…
                  </Link>
                  <span className="text-sm text-muted-foreground capitalize">{p.status.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
