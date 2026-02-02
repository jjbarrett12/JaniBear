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
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

export default async function WalkthroughsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: walkthroughs } = await supabase
    .from('walkthroughs')
    .select(`
      *,
      sites (name, address),
      opportunities (client_id, clients(name))
    `)
    .eq('org_id', org.org_id)
    .order('scheduled_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Walkthroughs</h1>
        <Link href="/app/walkthroughs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Walkthrough
          </Button>
        </Link>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Client / Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {walkthroughs?.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.scheduled_at ? format(new Date(w.scheduled_at), 'PPP p') : 'Unscheduled'}</TableCell>
                <TableCell>
                  <div className="font-medium">{w.opportunities?.clients?.name || 'Unknown Client'}</div>
                  <div className="text-sm text-muted-foreground">{w.sites?.name || w.sites?.address}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={w.status === 'completed' ? 'secondary' : 'default'}>
                    {w.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/app/walkthroughs/${w.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!walkthroughs?.length && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No walkthroughs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
