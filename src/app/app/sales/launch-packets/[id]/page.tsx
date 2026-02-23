import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { ContractLaunchThreeColumn } from '@/components/launch/contract-launch-three-column';
import { SendToOpsButton } from '@/components/launch/send-to-ops-button';
import type { LaunchPacketRecord } from '@/components/launch/launch-packet-detail';
import { Lock } from 'lucide-react';
import { isOperationsEnabled } from '@/lib/is-premium';

export default async function LaunchPacketSalesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const operationsEnabled = await isOperationsEnabled(org.org_id);
  if (!operationsEnabled) redirect('/app/sales/win-loss');

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
  const submitted = record.status === 'sent_to_ops' || record.status === 'accepted' || record.status === 'rejected';

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Launch to Operations</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Launch to Operations"
          description="Deal handoff to Operations. Complete the checklist, then Submit to Operations. Status: Draft → Ready → Submitted."
          primaryCta={
            canSendToOps ? (
              <SendToOpsButton packetId={id} />
            ) : (
              <Link href="/app/ops/launch-intake">
                <Button variant="outline">View in Launch Intake</Button>
              </Link>
            )
          }
        />
        {submitted && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              This launch has been submitted to Ops. Scope and proposal edits are locked; contact Ops to request changes.
            </p>
          </div>
        )}
        <ContractLaunchThreeColumn packet={record} />
      </div>
    </SalesPageShell>
  );
}
