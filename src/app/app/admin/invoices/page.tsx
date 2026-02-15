import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Receipt } from 'lucide-react';
import { InvoiceList } from '@/components/admin/invoice-list';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
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

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  let query = supabase
    .from('invoices')
    .select('*')
    .eq('org_id', org.org_id)
    .order('invoice_date', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.search) {
    query = query.or(
      `invoice_number.ilike.%${searchParams.search}%`
    );
  }

  const { data: invoices } = await query;

  // Get stats
  const { count: draftCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'draft');

  const { count: paidCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'paid');

  const { count: overdueCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'overdue');

  // Calculate totals
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('org_id', org.org_id)
    .eq('status', 'paid');

  const totalPaid = paidInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600 mt-2">Create and manage customer invoices</p>
        </div>
        <Link href="/app/admin/invoices/new">
          <Button size="lg" className="h-14 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{draftCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{paidCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{overdueCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoiceList invoices={invoices || []} />
    </div>
  );
}
