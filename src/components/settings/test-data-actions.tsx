'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedSampleData, seedSampleSalesData } from '@/actions/seed-sample-data';
import { useRouter } from 'next/navigation';
import { Loader2, Database, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Counts = {
  locations: number;
  leads: number;
  accounts: number;
  inspections: number;
  issues: number;
  crews: number;
  schedules: number;
};

export function TestDataActions({
  hasOpsData,
  hasSalesData,
  counts,
}: {
  hasOpsData: boolean;
  hasSalesData: boolean;
  counts: Counts;
}) {
  const [opsLoading, setOpsLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const canSeedOps = counts.locations === 0;
  const canSeedSales = counts.leads === 0;

  async function handleSeedOps() {
    if (!canSeedOps) return;
    setOpsLoading(true);
    const result = await seedSampleData();
    setOpsLoading(false);
    if (result.ok) {
      toast({ title: 'Ops data loaded', description: result.message });
      router.refresh();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleSeedSales() {
    if (!canSeedSales) return;
    setSalesLoading(true);
    const result = await seedSampleSalesData();
    setSalesLoading(false);
    if (result.ok) {
      toast({ title: 'Leads & accounts loaded', description: result.message });
      router.refresh();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSeedOps}
          disabled={!canSeedOps || opsLoading}
        >
          {opsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Load sample ops data (locations, crews, inspections, issues, schedules)
        </Button>
        {!canSeedOps && (
          <p className="text-xs text-muted-foreground">
            You already have locations. Seed only runs for empty orgs. Delete locations first if you want to re-seed.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleSeedSales}
          disabled={!canSeedSales || salesLoading}
        >
          {salesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          Load sample leads & customers (leads, accounts)
        </Button>
        {!canSeedSales && (
          <p className="text-xs text-muted-foreground">
            You already have leads. Seed only runs when there are no leads. Delete leads first if you want to re-seed.
          </p>
        )}
      </div>

      {(hasOpsData || hasSalesData) && (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          You have data loaded. Use the links below to test each module.
        </p>
      )}
    </div>
  );
}
