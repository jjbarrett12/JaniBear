import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function SalesApprovalsPage() {
  await requireOrg();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve proposals (optional workflow).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Approvals queue coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
