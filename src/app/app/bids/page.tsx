import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default async function BidsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: bids } = await supabase
    .from('bids')
    .select('*, locations(name)')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bids & Estimates</h1>
          <p className="text-gray-600 mt-1">Create and manage cleaning bids</p>
        </div>
        <Link href="/app/bids/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Bid
          </Button>
        </Link>
      </div>

      {bids && bids.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bids.map((bid: any) => (
            <Link key={bid.id} href={`/app/bids/${bid.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {bid.business_type || 'Bid'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {bid.locations && (
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {bid.locations.name}
                    </div>
                  )}
                  {bid.total_estimated_cost && (
                    <div className="text-2xl font-bold text-primary mt-2">
                      ${bid.total_estimated_cost.toLocaleString()}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {formatDate(bid.created_at)} • {bid.status}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No bids yet</p>
            <Link href="/app/bids/new">
              <Button>Create Your First Bid</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
