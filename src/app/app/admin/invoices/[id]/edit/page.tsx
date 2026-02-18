import { redirect, notFound } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/admin/invoice-form';

export default async function EditInvoicePage({
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

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
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
    .eq('invoice_id', invoice.id);

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Invoice</h1>
        <p className="text-gray-600 mt-2">Update invoice information</p>
      </div>
      <InvoiceForm invoice={{ ...invoice, items: items || [] }} locations={locations || []} />
    </div>
  );
}
