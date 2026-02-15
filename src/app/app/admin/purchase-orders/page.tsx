import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { POList } from '@/components/admin/po-list';

export default async function PurchaseOrdersPage({
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
    .from('purchase_orders')
    .select('*')
    .eq('org_id', org.org_id)
    .order('order_date', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.search) {
    query = query.or(
      `po_number.ilike.%${searchParams.search}%,supplier_name.ilike.%${searchParams.search}%`
    );
  }

  const { data: purchaseOrders } = await query;

  // Get stats
  const { count: draftCount } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'draft');

  const { count: pendingCount } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'pending');

  const { count: orderedCount } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .in('status', ['ordered', 'in_transit']);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-gray-600 mt-2">Manage supply orders and PO numbers</p>
        </div>
        <Link href="/app/admin/purchase-orders/new">
          <Button size="lg" className="h-14 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            Create Purchase Order
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Ordered/In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{orderedCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <POList purchaseOrders={purchaseOrders || []} />
    </div>
  );
}
