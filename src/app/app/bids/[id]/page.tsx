import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function BidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: bid } = await supabase
    .from('bids')
    .select('*, locations(name)')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!bid) {
    notFound();
  }

  const formatCurrency = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/bids">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {bid.business_type || 'Bid'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {formatDate(bid.created_at)} • {bid.status}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Estimate details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bid.locations?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              {bid.locations.name}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {bid.square_footage != null && (
              <div>
                <span className="text-gray-500">Square footage</span>
                <p className="font-medium">{Number(bid.square_footage).toLocaleString()} sq ft</p>
              </div>
            )}
            {bid.days_per_week != null && (
              <div>
                <span className="text-gray-500">Days per week</span>
                <p className="font-medium">{bid.days_per_week}</p>
              </div>
            )}
            {bid.hourly_rate != null && (
              <div>
                <span className="text-gray-500">Hourly rate</span>
                <p className="font-medium">{formatCurrency(Number(bid.hourly_rate))}</p>
              </div>
            )}
            {bid.restrooms_count != null && bid.restrooms_count > 0 && (
              <div>
                <span className="text-gray-500">Restrooms / stalls / sinks</span>
                <p className="font-medium">{bid.restrooms_count} / {bid.stalls_count ?? 0} / {bid.sinks_count ?? 0}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Labor</span>
              <span className="font-medium">{formatCurrency(bid.estimated_labor_cost != null ? Number(bid.estimated_labor_cost) : null)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Supplies</span>
              <span className="font-medium">{formatCurrency(bid.estimated_supply_cost != null ? Number(bid.estimated_supply_cost) : null)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Chemicals</span>
              <span className="font-medium">{formatCurrency(bid.estimated_chemical_cost != null ? Number(bid.estimated_chemical_cost) : null)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <span>Total (monthly)</span>
              <span className="text-primary">
                {formatCurrency(bid.total_estimated_cost != null ? Number(bid.total_estimated_cost) : null)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link href="/app/bids">
        <Button variant="outline">Back to Bids & Estimates</Button>
      </Link>
    </div>
  );
}
