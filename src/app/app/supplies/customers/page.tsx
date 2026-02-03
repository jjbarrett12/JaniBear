import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  ArrowRight,
  Building2,
  Package,
  ShoppingCart
} from 'lucide-react';

export default async function CustomerProductsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Get clients with their product counts
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, created_at')
    .eq('org_id', org.org_id)
    .order('name', { ascending: true });

  // Get product counts per client
  const clientIds = clients?.map(c => c.id) || [];
  const { data: productCounts } = await supabase
    .from('customer_products')
    .select('client_id')
    .eq('org_id', org.org_id)
    .in('client_id', clientIds.length > 0 ? clientIds : ['00000000-0000-0000-0000-000000000000']);

  const countByClient: Record<string, number> = {};
  productCounts?.forEach(p => {
    if (p.client_id) {
      countByClient[p.client_id] = (countByClient[p.client_id] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/supplies" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Customer Products</h1>
          <p className="text-gray-600">Assign products to customers for easy reordering</p>
        </div>
      </div>

      {/* Customers List */}
      {clients && clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const productCount = countByClient[client.id] || 0;
            return (
              <Link key={client.id} href={`/app/supplies/customers/${client.id}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-violet-100">
                          <Building2 className="h-5 w-5 text-violet-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-violet-600">
                          {client.name}
                        </h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-violet-500" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Package className="h-4 w-4" />
                        <span>{productCount} product{productCount !== 1 ? 's' : ''} assigned</span>
                      </div>
                      {productCount > 0 && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          Ready to order
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-500 mb-6">Add customers from walkthroughs or the CRM to assign products</p>
            <Link href="/app/walkthroughs/new">
              <Button>Start a Walkthrough</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
