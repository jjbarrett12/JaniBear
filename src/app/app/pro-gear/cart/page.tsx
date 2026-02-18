import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/pro-gear/product-card';
import { CartActions, SubmitOrderButton } from '@/components/pro-gear/cart-actions';

export default async function ProGearCartPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const supabase = await createClient();
  const { data: order } = await supabase
    .from('pro_gear_orders')
    .select('id, status, subtotal_cents, shipping_cents, total_cents')
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Cart</h1>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Your cart is empty.
            <div className="mt-4">
              <Button asChild>
                <Link href="/app/pro-gear">Browse Pro Gear</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: items } = await supabase
    .from('pro_gear_order_items')
    .select(
      'id, product_id, quantity, unit_price_cents, line_total_cents, pro_gear_products(id, slug, name, category)'
    )
    .eq('order_id', order.id);

  const lineItems = items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.length === 0 ? (
                <p className="text-muted-foreground">No items.</p>
              ) : (
                lineItems.map((item: { id: string; product_id: string; quantity: number; unit_price_cents: number; line_total_cents: number; pro_gear_products: { id: string; slug: string; name: string } | null }) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <Link
                        href={`/app/pro-gear/product/${(item.pro_gear_products as { slug: string })?.slug}`}
                        className="font-medium hover:underline"
                      >
                        {(item.pro_gear_products as { name: string })?.name ?? 'Product'}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.unit_price_cents)} × {item.quantity} ={' '}
                        {formatPrice(item.line_total_cents)}
                      </p>
                    </div>
                    <CartActions
                      orderItemId={item.id}
                      quantity={item.quantity}
                      productSlug={(item.pro_gear_products as { slug: string })?.slug}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>—</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-medium">
                <span>Total</span>
                <span>{formatPrice(order.total_cents)}</span>
              </div>
              {lineItems.length > 0 && (
                <SubmitOrderForm orderId={order.id} totalCents={order.total_cents} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SubmitOrderForm({ orderId, totalCents }: { orderId: string; totalCents: number }) {
  return (
    <div className="mt-4">
      <SubmitOrderButton orderId={orderId} totalCents={totalCents} />
    </div>
  );
}
