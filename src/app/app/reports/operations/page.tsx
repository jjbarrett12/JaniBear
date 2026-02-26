import { requireOrg } from '@/lib/auth';
import { PageLayout } from '@/components/enterprise';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export default async function ReportsOperationsPage() {
  await requireOrg();
  return (
    <PageLayout>
      <div className="space-y-4">
        <Link href="/app/reports">
          <Button variant="ghost" size="sm">← Reports</Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Operations report</h1>
        <p className="text-muted-foreground">Crew utilization, SLA compliance, inspections. (Placeholder.)</p>
      </div>
    </PageLayout>
  );
}
