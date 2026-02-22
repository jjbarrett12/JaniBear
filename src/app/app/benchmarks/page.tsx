import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import {
  getBenchmarkSettings,
  getOrgBenchmarkMetrics,
  getBenchmarkAggregates,
} from '@/actions/benchmarking';
import { BenchmarkPageClient } from '@/components/benchmark/benchmark-page-client';

export default async function BenchmarksPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();

  const [settings, orgMetrics, aggregates] = await Promise.all([
    getBenchmarkSettings(org.org_id),
    getOrgBenchmarkMetrics(org.org_id),
    getBenchmarkAggregates(),
  ]);

  const isAdmin = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase());

  return (
    <BenchmarkPageClient
      orgId={org.org_id}
      optedIn={settings.benchmarkingOptIn}
      companySizeBucket={settings.companySizeBucket}
      vertical={settings.vertical}
      orgMetrics={{
        closeRate: orgMetrics.closeRate ?? null,
        inspectionScore: orgMetrics.inspectionScore ?? null,
        grossMargin: orgMetrics.grossMargin ?? null,
        costPerSqft: orgMetrics.costPerSqft ?? null,
      }}
      aggregateRows={aggregates.rows}
      canManageSettings={isAdmin}
    />
  );
}
