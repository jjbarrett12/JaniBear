import { notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Edit, Calendar, Package, DollarSign, Mail, Phone, MapPin } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default async function PODetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: po } = await supabase
    .from('purchase_orders')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!po) {
    notFound();
  }

  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('po_id', po.id)
    .order('created_at');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'ordered':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{po.po_number}</h1>
          <Badge className={getStatusColor(po.status)}>
            {po.status.replace('_', ' ')}
          </Badge>
        </div>
        <Link href={`/app/admin/purchase-orders/${po.id}/edit`}>
          <Button size="lg" className="h-14 text-lg">
            <Edit className="h-5 w-5 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Supplier Name</div>
                <div className="font-medium text-lg">{po.supplier_name}</div>
              </div>
              {po.supplier_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="font-medium">{po.supplier_email}</div>
                </div>
              )}
              {po.supplier_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div className="font-medium">{po.supplier_phone}</div>
                </div>
              )}
              {po.supplier_address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                  <div className="font-medium">{po.supplier_address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items && items.length > 0 ? (
                  <>
                    {items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-semibold">{item.item_name}</div>
                          {item.description && (
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          )}
                          <div className="text-sm text-gray-500 mt-1">
                            {item.quantity} {item.unit} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <div className="font-semibold text-lg">
                          {formatCurrency(item.total_price)}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(po.total_amount)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No items</p>
                )}
              </div>
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Order Date</div>
                  <div className="font-medium">{formatDate(po.order_date)}</div>
                </div>
              </div>
              {po.expected_delivery_date && (
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Expected Delivery</div>
                    <div className="font-medium">{formatDate(po.expected_delivery_date)}</div>
                  </div>
                </div>
              )}
              {po.actual_delivery_date && (
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-500">Actual Delivery</div>
                    <div className="font-medium">{formatDate(po.actual_delivery_date)}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="font-medium text-lg">{formatCurrency(po.total_amount)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
