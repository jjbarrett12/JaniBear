import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown } from 'lucide-react';

export default async function ProGearOptimizationPage() {
  await requireOrg();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cost optimization</h1>
        <p className="mt-1 text-muted-foreground">
          Swap suggestions and savings opportunities based on your usage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Savings opportunities
          </CardTitle>
          <CardDescription>
            We’ll suggest product swaps and bulk tiers to protect more margin. This section will show personalized recommendations as you order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check the overview for &quot;Savings opportunities&quot; and category average discounts. More optimization features coming soon.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/app/pro-gear">Back to Pro Gear</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
