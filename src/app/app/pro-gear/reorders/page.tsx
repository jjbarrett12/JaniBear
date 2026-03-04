import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, RotateCcw } from 'lucide-react';

export default async function ProGearReordersPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: recurring } = await supabase
    .from('pro_gear_recurring_orders')
    .select('id, frequency_days, next_run_at, is_active, items')
    .eq('org_id', org.org_id)
    .order('next_run_at', { ascending: true });

  const list = recurring ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recurring &amp; smart reorders</h1>
        <p className="mt-1 text-muted-foreground">
          Manage recurring orders and see suggestions based on your order history.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recurring orders</h2>
        {list.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No recurring orders yet. Add items from a product or your cart, then choose &quot;Add to recurring&quot; to set up automatic reorders.
              </p>
              <Button asChild className="mt-4">
                <Link href="/app/pro-gear">Browse Pro Gear</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {list.map((r) => {
              const itemCount = Array.isArray(r.items) ? r.items.length : 0;
              return (
                <Card key={r.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Every {r.frequency_days} days
                    </CardTitle>
                    <Badge variant={r.is_active ? 'default' : 'secondary'}>
                      {r.is_active ? 'Active' : 'Paused'}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Next run: {new Date(r.next_run_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      {itemCount > 0 && ` · ${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                    </p>
                    <Link
                      href={`/app/pro-gear/orders`}
                      className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      View order history
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Smart reorder</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Based on your last 90 days
            </CardTitle>
            <CardDescription>
              Suggestions will appear here once you have order history. Reorder your last order with one click from Order history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/app/pro-gear/orders">Go to Order history</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
