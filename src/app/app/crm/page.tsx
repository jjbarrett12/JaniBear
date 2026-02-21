import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientsSearchFilter } from '@/components/crm/clients-search-filter';

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { q = '', status } = await searchParams;

  let query = supabase
    .from('clients')
    .select('id, name, status, created_at')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  if (typeof status === 'string' && ['lead', 'active', 'paused', 'former'].includes(status)) {
    query = query.eq('status', status);
  }
  if (typeof q === 'string' && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }

  const { data: clients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">CRM</h1>
        <Link href="/app/crm/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      <ClientsSearchFilter initialQ={typeof q === 'string' ? q : ''} initialStatus={typeof status === 'string' ? status : undefined} />

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients?.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <Link href={`/app/crm/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </Link>
                </TableCell>
                <TableCell>{(client as { status?: string }).status ?? '—'}</TableCell>
                <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/app/crm/clients/${client.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!clients?.length && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
