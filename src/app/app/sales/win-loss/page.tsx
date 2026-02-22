import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function WinLossPage() {
  await requireOrg();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Win/Loss</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and analyze won and lost opportunities.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Win/Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Win/Loss analytics coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
