import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, MapPin, Calendar, User, QrCode, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string; status?: string }> | { facility?: string; status?: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const resolved = typeof (searchParams as Promise<unknown>)?.then === 'function' ? await (searchParams as Promise<{ facility?: string; status?: string }>) : (searchParams as { facility?: string; status?: string });

  let query = supabase
    .from('service_tickets')
    .select('*, facilities(name, account_id), profiles(full_name)')
    .eq('org_id', org.org_id);

  if (resolved.facility) {
    query = query.eq('facility_id', resolved.facility);
  }
  if (resolved.status) {
    query = query.eq('status', resolved.status);
  }

  const { data: tickets } = await query.order('created_at', { ascending: false });

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Requests from QR scans and manual entries — track and resolve
          </p>
        </div>
        <Link href="/app/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New ticket
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/app/tickets">
          <Button variant={!resolved.status ? 'default' : 'outline'} size="sm">
            All
          </Button>
        </Link>
        <Link href="/app/tickets?status=open">
          <Button variant={resolved.status === 'open' ? 'default' : 'outline'} size="sm">
            Open
          </Button>
        </Link>
        <Link href="/app/tickets?status=in_progress">
          <Button variant={resolved.status === 'in_progress' ? 'default' : 'outline'} size="sm">
            In Progress
          </Button>
        </Link>
        <Link href="/app/tickets?status=resolved">
          <Button variant={resolved.status === 'resolved' ? 'default' : 'outline'} size="sm">
            Resolved
          </Button>
        </Link>
      </div>

      {tickets && tickets.length > 0 ? (
        <div className="space-y-4">
          {(tickets as any[]).map((ticket) => (
            <Link key={ticket.id} href={`/app/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {ticket.source === 'qr' ? (
                          <QrCode className="h-5 w-5 text-primary shrink-0" />
                        ) : (
                          <Ticket className="h-5 w-5 text-primary shrink-0" />
                        )}
                        <h3 className="text-lg font-semibold truncate">{ticket.title}</h3>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 shrink-0" />
                          {(ticket as { facilities?: { name?: string } }).facilities?.name}
                        </span>
                        {ticket.contact_name && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4 shrink-0" />
                            {ticket.contact_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {formatDate(ticket.created_at)}
                        </span>
                        {ticket.assignee_user_id && (ticket as any).profiles?.full_name && (
                          <span className="flex items-center gap-1">
                            Assigned: {(ticket as any).profiles.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status]}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${priorityColors[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No service tickets yet</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tickets are created when someone scans a facility QR code or you add one manually.
            </p>
            <Link href="/app/accounts" className="mt-4 inline-block">
              <Button variant="outline">View accounts & facilities</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
