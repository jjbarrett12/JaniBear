import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function LaunchPacketsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: packets } = await supabase
    .from('launch_packets')
    .select('id, account_id, status, created_at, ready_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false })
    .limit(50);

  const list = (packets ?? []) as { id: string; account_id: string; status: string; created_at: string; ready_at: string | null }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            Launch Packet
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sales handoff artifact: move to Ready, then Ops accepts or rejects in Launch Intake.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packets</CardTitle>
          <p className="text-sm text-muted-foreground">
            Draft → Review → Ready → SentToOps → Accepted | Rejected
          </p>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-muted-foreground">No launch packets yet. Create one from a won opportunity or account.</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between">
                  <Link href={`/app/sales/launch-packets/${p.id}`} className="font-medium text-primary hover:underline">
                    {p.id.slice(0, 8)}…
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
