import { requireOrg } from '@/lib/auth';
import { PageLayout } from '@/components/enterprise';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export default async function ReportsAccountsPage() {
  await requireOrg();
  return (
    <PageLayout>
      <div className="space-y-4">
        <Link href="/app/reports">
          <Button variant="ghost" size="sm">← Reports</Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Account health report</h1>
        <p className="text-muted-foreground">Account health, churn risk, engagement. (Placeholder — wire to your account data.)</p>
      </div>
    </PageLayout>
  );
}
