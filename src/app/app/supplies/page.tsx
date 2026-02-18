import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Building2, 
  Plus, 
  ShoppingCart,
  ArrowRight,
  Users,
  FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function SuppliesPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Get counts
  const [vendorsResult, productsResult, clientsResult, recentOrdersResult] = await Promise.all([
    supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('org_id', org.org_id)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('org_id', org.org_id)
      .eq('is_active', true),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.org_id),
    supabase
      .from('purchase_orders')
      .select('*, vendors(name)')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const vendors = vendorsResult.data || [];
  const products = productsResult.data || [];
  const clientCount = clientsResult.count || 0;
  const recentOrders = recentOrdersResult.data || [];

  // Get preferred vendors
  const preferredVendors = vendors.filter(v => v.is_preferred);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supply Management</h1>
          <p className="text-muted-foreground mt-1">Manage vendors, products, and customer orders</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/supplies/orders/new">
            <Button size="lg" className="h-12">
              <ShoppingCart className="h-5 w-5 mr-2" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/app/supplies/vendors">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{vendors.length}</p>
                  <p className="text-sm text-gray-500">Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/supplies/products">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <Package className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-gray-500">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/supplies/customers">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{clientCount}</p>
                  <p className="text-sm text-gray-500">Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/admin/purchase-orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentOrders.length}</p>
                  <p className="text-sm text-gray-500">Recent POs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preferred Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Preferred Vendors
              </CardTitle>
              <CardDescription>Your go-to suppliers</CardDescription>
            </div>
            <Link href="/app/supplies/vendors/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Vendor
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {preferredVendors.length > 0 ? (
              <div className="space-y-3">
                {preferredVendors.slice(0, 5).map((vendor) => (
                  <Link key={vendor.id} href={`/app/supplies/vendors/${vendor.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div>
                        <p className="font-medium text-foreground group-hover:text-blue-600">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.contact_name || vendor.email || 'No contact'}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">No preferred vendors yet</p>
                <Link href="/app/supplies/vendors/new">
                  <Button variant="outline" size="sm">Add Your First Vendor</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-500" />
                Recent Orders
              </CardTitle>
              <CardDescription>Latest purchase orders</CardDescription>
            </div>
            <Link href="/app/admin/purchase-orders">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <Link key={order.id} href={`/app/admin/purchase-orders/${order.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground group-hover:text-amber-600">{order.po_number}</p>
                          <Badge variant="secondary" className={
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{order.vendors?.name || order.supplier_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{formatCurrency(order.total_amount || 0)}</p>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-amber-500 ml-auto" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">No orders yet</p>
                <Link href="/app/supplies/orders/new">
                  <Button variant="outline" size="sm">Create First Order</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/app/supplies/vendors/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Truck className="h-6 w-6" />
                <span>Add Vendor</span>
              </Button>
            </Link>
            <Link href="/app/supplies/products/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                <span>Add Product</span>
              </Button>
            </Link>
            <Link href="/app/supplies/customers">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Users className="h-6 w-6" />
                <span>Customer Products</span>
              </Button>
            </Link>
            <Link href="/app/supplies/orders/new">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <ShoppingCart className="h-6 w-6" />
                <span>Quick Reorder</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
