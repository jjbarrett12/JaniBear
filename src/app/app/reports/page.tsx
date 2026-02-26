import { requireOrg } from '@/lib/auth';
import { PageLayout } from '@/components/enterprise';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileBarChart, DollarSign, Building2, ClipboardCheck } from 'lucide-react';

export const revalidate = 60;

export default async function ReportsPage() {
  await requireOrg();

  const reportCards = [
    {
      title: 'Revenue',
      description: 'Revenue trends, by account, period comparison, and exports.',
      href: '/app/reports/revenue',
      icon: DollarSign,
    },
    {
      title: 'Operations',
      description: 'Crew utilization, SLA compliance, inspections, and delivery metrics.',
      href: '/app/reports/operations',
      icon: Building2,
    },
    {
      title: 'Accounts',
      description: 'Account health, churn risk, and engagement over time.',
      href: '/app/reports/accounts',
      icon: FileBarChart,
    },
    {
      title: 'Inspections & QA',
      description: 'Inspection completion, scores, and quality trends.',
      href: '/app/inspections',
      icon: ClipboardCheck,
    },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">
            Deep analytics, filters, and exports. Use the dashboard for daily intelligence.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <Link key={report.href} href={report.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                    </div>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
