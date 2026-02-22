import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { requireOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/components/pro-gear/product-card';
import { ReorderButton } from '@/components/pro-gear/reorder-button';

export default async function ProGearOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; paid?: string; financed?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');
  const org = await requireOrg();

  const { submitted, paid, financed } = await searchParams;
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from('pro_gear_orders')
    .select('id, status, total_cents, savings_total_cents, payment_type, financing_months, created_at')
    .eq('user_id', user.id)
    .or(`org_id.eq.${org.org_id},org_id.is.null`)
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  const list = orders ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Order history</h1>

      {paid && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="py-4">
            <p className="font-medium text-green-800 dark:text-green-200">
              Payment received. Your order is confirmed.
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              It may take a moment to appear below.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/app/pro-gear">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {financed && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="py-4">
            <p className="font-medium text-green-800 dark:text-green-200">
              Financing set up. Your first payment was charged; remaining payments will run automatically each month on your card.
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              It may take a moment to appear below.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/app/pro-gear">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {submitted && !paid && !financed && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="py-4">
            <p className="font-medium text-green-800 dark:text-green-200">
              Order submitted for financing. We&apos;ll contact you to complete the process.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/app/pro-gear">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No orders yet.
            <Button asChild className="mt-4">
              <Link href="/app/pro-gear">Browse Pro Gear</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((order: { id: string; status: string; total_cents: number; savings_total_cents?: number | null; payment_type: string | null; financing_months: number | null; created_at: string }) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {order.payment_type === 'one_time' && (
                    <Badge variant="default" className="bg-green-600">Paid</Badge>
                  )}
                  {order.payment_type === 'financed' && (
                    <Badge variant="secondary">
                      Financed{order.financing_months ? ` ${order.financing_months} mo` : ''}
                    </Badge>
                  )}
                  <Badge
                    variant={
                      order.status === 'shipped'
                        ? 'default'
                        : order.status === 'canceled'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      dateStyle: 'medium',
                    })}
                  </span>
                  <span className="font-medium">
                    {formatPrice(order.total_cents)}
                  </span>
                </div>
                {order.savings_total_cents != null && order.savings_total_cents > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    You saved {formatPrice(order.savings_total_cents)}
                  </p>
                )}
                <ReorderButton orderId={order.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
