'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, QrCode, Ticket, Loader2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ServiceTicketDetailProps {
  ticket: any;
  assignableUsers: Array<{ id: string; full_name: string | null }>;
}

export function ServiceTicketDetail({ ticket: initialTicket, assignableUsers }: ServiceTicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [loading, setLoading] = useState(false);

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  const updateField = async (field: string, value: string | null) => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('service_tickets')
      .update({ [field]: value })
      .eq('id', ticket.id);

    if (!error) {
      setTicket((prev: any) => ({ ...prev, [field]: value }));
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/tickets">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
            {ticket.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {(ticket as { facilities?: { name?: string } }).facilities?.name}
            {ticket.source === 'qr' && (
              <span className="inline-flex items-center gap-1 ml-2 text-sm text-primary">
                <QrCode className="h-4 w-4" /> From QR
              </span>
            )}
          </p>
        </div>
        <Select
          value={ticket.status}
          onValueChange={(v) => updateField('status', v)}
          disabled={loading}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {ticket.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Status</Label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status]}`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Priority</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={(v) => updateField('priority', v)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Assignee</Label>
                <Select
                  value={ticket.assignee_user_id ?? 'unassigned'}
                  onValueChange={(v) => updateField('assignee_user_id', v === 'unassigned' ? null : v)}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(ticket.contact_name || ticket.contact_phone) && (
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Submitted by</Label>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {ticket.contact_name && <span>{ticket.contact_name}</span>}
                    {ticket.contact_phone && (
                      <span className={ticket.contact_name ? ' ml-2' : ''}>
                        {ticket.contact_phone}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-gray-500 dark:text-gray-400">Created</Label>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  {formatDateTime(ticket.created_at)}
                </div>
              </div>
              {ticket.resolved_at && (
                <div>
                  <Label className="text-xs text-gray-500 dark:text-gray-400">Resolved</Label>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                    {formatDateTime(ticket.resolved_at)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.facility_id && (ticket as { facilities?: { account_id: string } }).facilities?.account_id && (
            <Link href={`/app/accounts/${(ticket as { facilities: { account_id: string } }).facilities.account_id}/facilities/${ticket.facility_id}`}>
              <Button variant="outline" className="w-full">
                <Ticket className="h-4 w-4 mr-2" />
                View facility & QR code
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
