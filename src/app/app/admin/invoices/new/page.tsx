import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { InvoiceForm } from '@/components/admin/invoice-form';

export default async function NewInvoicePage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  // Fetch locations for dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
        <p className="text-gray-600 mt-2">Create a new customer invoice</p>
      </div>
      <InvoiceForm locations={locations || []} />
    </div>
  );
}
