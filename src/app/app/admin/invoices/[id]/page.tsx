import { redirect, notFound } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

const ADMIN_ROLES = ['owner', 'admin', 'manager'];

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
    .single();

  if (!member || !ADMIN_ROLES.includes(member.role)) {
    redirect('/app/admin');
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!invoice) {
    notFound();
  }

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('sort_order', { ascending: true });

  const statusBadge = () => {
    const status = (invoice.status as string) ?? 'draft';
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1 inline" /> Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1 inline" /> Overdue</Badge>;
      case 'sent':
      case 'viewed':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1 inline" /> {status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app/admin/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{invoice.invoice_number ?? 'Invoice'}</h1>
            <p className="text-sm text-muted-foreground">Invoice details</p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/app/admin/invoices/${params.id}/edit`} className="inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Summary</CardTitle>
            {statusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Invoice date</dt>
              <dd className="text-foreground">{invoice.invoice_date ? formatDate(invoice.invoice_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Due date</dt>
              <dd className="text-foreground">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Status</dt>
              <dd>{statusBadge()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Total</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatCurrency(Number(invoice.total_amount ?? 0))}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {items && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {items.map((item: { id: string; description?: string; quantity?: number; unit_price?: number; amount?: number }) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-start gap-4">
                  <span className="text-foreground">{item.description ?? 'Item'}</span>
                  <span className="text-muted-foreground shrink-0">
                    {item.quantity != null && item.unit_price != null
                      ? formatCurrency(Number(item.amount ?? item.quantity * item.unit_price))
                      : item.amount != null
                        ? formatCurrency(Number(item.amount))
                        : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href="/app/admin/invoices">Back to invoices</Link>
        </Button>
        <Button asChild>
          <Link href={`/app/admin/invoices/${params.id}/edit`}>Edit invoice</Link>
        </Button>
      </div>
    </div>
  );
}
