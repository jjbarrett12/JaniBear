import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft,
  Building2,
  ShoppingCart,
  Package
} from 'lucide-react';
import { CustomerProductManager } from '@/components/supplies/customer-product-manager';

export default async function CustomerProductsDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  // Get client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!client) notFound();

  // Get assigned products
  const { data: customerProducts } = await supabase
    .from('customer_products')
    .select('*, products(*, vendors(name))')
    .eq('org_id', org.org_id)
    .eq('client_id', id);

  // Get all available products
  const { data: allProducts } = await supabase
    .from('products')
    .select('*, vendors(name)')
    .eq('org_id', org.org_id)
    .eq('is_active', true)
    .order('name');

  // Get vendors for ship-to options
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('org_id', org.org_id)
    .eq('is_active', true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/supplies/customers" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100">
              <Building2 className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <p className="text-gray-600">Manage products for this customer</p>
            </div>
          </div>
        </div>
        <Link href={`/app/supplies/orders/new?client=${id}`}>
          <Button>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Order
          </Button>
        </Link>
      </div>

      <CustomerProductManager
        orgId={org.org_id}
        clientId={id}
        clientName={client.name}
        customerProducts={customerProducts || []}
        allProducts={allProducts || []}
        vendors={vendors || []}
      />
    </div>
  );
}
