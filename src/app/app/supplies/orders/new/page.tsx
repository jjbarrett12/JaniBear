import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QuickOrderForm } from '@/components/supplies/quick-order-form';

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; vendor?: string }>;
}) {
  const { client: clientId, vendor: vendorId } = await searchParams;
  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  // Get vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('org_id', org.org_id)
    .eq('is_active', true)
    .order('is_preferred', { ascending: false })
    .order('name');

  // Get clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  // Get products
  const { data: products } = await supabase
    .from('products')
    .select('*, vendors(name)')
    .eq('org_id', org.org_id)
    .eq('is_active', true)
    .order('name');

  // Get customer products if client is selected
  let customerProducts = null;
  if (clientId) {
    const { data } = await supabase
      .from('customer_products')
      .select('*, products(*, vendors(name))')
      .eq('org_id', org.org_id)
      .eq('client_id', clientId);
    customerProducts = data;
  }

  // Get selected client
  let selectedClient = null;
  if (clientId) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    selectedClient = data;
  }

  // Get organization for default bill-to
  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', org.org_id)
    .single();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/supplies" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="text-gray-600">
            {selectedClient 
              ? `Order for ${selectedClient.name}`
              : 'Create a new supply order'}
          </p>
        </div>
      </div>

      <QuickOrderForm
        orgId={org.org_id}
        userId={user?.id || ''}
        vendors={vendors || []}
        clients={clients || []}
        products={products || []}
        customerProducts={customerProducts || []}
        selectedClientId={clientId}
        selectedVendorId={vendorId}
        organization={orgData}
      />
    </div>
  );
}
