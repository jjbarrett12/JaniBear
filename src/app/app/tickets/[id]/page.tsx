import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { ServiceTicketDetail } from '@/components/tickets/service-ticket-detail';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from('service_tickets')
    .select('*, locations(id, name), profiles(full_name)')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!ticket) {
    notFound();
  }

  // Load org members for assignee dropdown
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, profiles(full_name)')
    .eq('org_id', org.org_id)
    .in('role', ['owner', 'manager', 'inspector']);

  const assignableUsers =
    members?.map((m: any) => ({ id: m.user_id, full_name: m.profiles?.full_name ?? null })) ?? [];

  return (
    <ServiceTicketDetail
      ticket={ticket}
      assignableUsers={assignableUsers}
    />
  );
}
