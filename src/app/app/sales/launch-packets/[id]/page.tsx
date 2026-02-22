import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LaunchPacketDetail, type LaunchPacketRecord } from '@/components/launch/launch-packet-detail';
import { SendToOpsButton } from '@/components/launch/send-to-ops-button';

export default async function LaunchPacketSalesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('launch_packets')
    .select(`
      id, org_id, account_id, status, payload_jsonb,
      ready_at, accepted_at, rejected_at, rejected_reason,
      created_at, updated_at,
      accounts(id, name, status)
    `)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!packet) notFound();

  const rawAccount = (packet as { accounts?: unknown }).accounts;
  const account = Array.isArray(rawAccount) ? rawAccount[0] : rawAccount;

  const record: LaunchPacketRecord = {
    id: packet.id,
    org_id: packet.org_id,
    account_id: packet.account_id,
    status: packet.status,
    payload_jsonb: packet.payload_jsonb ?? {},
    ready_at: packet.ready_at ?? null,
    accepted_at: packet.accepted_at ?? null,
    rejected_at: packet.rejected_at ?? null,
    rejected_reason: packet.rejected_reason ?? null,
    created_at: packet.created_at,
    updated_at: packet.updated_at,
    account: account ? { name: account.name, status: account.status } : null,
  };

  const canSendToOps = record.status === 'draft' || record.status === 'review';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sales/launch-packets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Launch Packet</h1>
          <p className="text-muted-foreground text-sm">Sales handoff — send to Ops when ready.</p>
        </div>
      </div>

      <LaunchPacketDetail packet={record} mode="sales">
        {canSendToOps && (
          <div className="flex gap-2">
            <SendToOpsButton packetId={id} />
          </div>
        )}
      </LaunchPacketDetail>
    </div>
  );
}
