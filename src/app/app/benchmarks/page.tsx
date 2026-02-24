import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import {
  getBenchmarkSettings,
  getOrgBenchmarkMetrics,
  getBenchmarkAggregates,
  getBenchmarkCodeAggregate,
} from '@/actions/benchmarking';
import { BenchmarkPageClient } from '@/components/benchmark/benchmark-page-client';

export default async function BenchmarksPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();

  const [settings, orgMetrics, aggregates, codeAggregate] = await Promise.all([
    getBenchmarkSettings(org.org_id),
    getOrgBenchmarkMetrics(org.org_id),
    getBenchmarkAggregates(),
    getBenchmarkCodeAggregate(org.org_id),
  ]);

  const isAdmin = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase());
  const hasAnyBenchmark = settings.benchmarkingOptIn || (settings.benchmarkShareCode != null && settings.benchmarkShareCode.trim() !== '');

  return (
    <BenchmarkPageClient
      orgId={org.org_id}
      optedIn={settings.benchmarkingOptIn}
      companySizeBucket={settings.companySizeBucket}
      vertical={settings.vertical}
      shareCode={settings.benchmarkShareCode ?? null}
      codeAggregate={codeAggregate}
      orgMetrics={{
        closeRate: orgMetrics.closeRate ?? null,
        inspectionScore: orgMetrics.inspectionScore ?? null,
        grossMargin: orgMetrics.grossMargin ?? null,
        costPerSqft: orgMetrics.costPerSqft ?? null,
      }}
      aggregateRows={aggregates.rows}
      canManageSettings={isAdmin}
      hasAnyBenchmark={hasAnyBenchmark}
    />
  );
}
