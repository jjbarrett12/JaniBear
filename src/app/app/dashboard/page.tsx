import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { isSalesRepRole } from '@/types/sales';
import { resolveShellForOrg } from '@/lib/shell';
import { PageLayout } from '@/components/enterprise';
import { CommandCenterHeader } from '@/components/dashboard/CommandCenterHeader';
import { RevenuePulseCard } from '@/components/dashboard/RevenuePulseCard';
import { RiskAlertCard } from '@/components/dashboard/RiskAlertCard';
import { CrewStatusCard } from '@/components/dashboard/CrewStatusCard';
import { AccountHealthCard } from '@/components/dashboard/AccountHealthCard';
import { QualitySnapshotCard } from '@/components/dashboard/QualitySnapshotCard';
import { ARSnapshotCard } from '@/components/dashboard/ARSnapshotCard';
import { PipelineSnapshotCard } from '@/components/dashboard/PipelineSnapshotCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { getCommandCenterData } from '@/lib/command-center-data';
import { Award } from 'lucide-react';

export const revalidate = 60;

/**
 * Owner Command Center: daily control view — revenue, risk, crew, accounts,
 * quality, AR, pipeline, AI. No reporting clutter; click-through to deep modules.
 */
export default async function DashboardPage() {
  const org = await requireOrg();
  const shell = await resolveShellForOrg(org.org_id);
  if (shell === 'franchisor') {
    redirect('/app/franchise');
  }
  const { context } = await getUserContext();

  if (isFranchisor(context)) {
    redirect('/app/franchise');
  }
  if (isSalesRepRole(context.role, context.roleEnum)) {
    redirect('/app/sales-dashboard');
  }

  const data = await getCommandCenterData(org.org_id);
  const isFranchisee = context.orgType === 'franchisee';

  return (
    <PageLayout>
      <CommandCenterHeader
        userName={data.userName}
        subtitle="Here's what requires your attention today."
      />
      {isFranchisee && (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-4 flex items-center justify-between gap-4 flex-wrap mb-6">
          <p className="text-sm text-muted-foreground">
            You&apos;re viewing your franchise location. Compare outcomes and optional standards in KPI Dashboard and Financial Health.
          </p>
          <Link
            href="/app/templates"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Award className="h-4 w-4 shrink-0" />
            View suggested brand standards
          </Link>
        </div>
      )}

      {/* Section 1: Primary cards — 4 cols desktop / 2 tablet / 1 mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <RevenuePulseCard data={data.revenue} />
        <RiskAlertCard data={data.risk} />
        <CrewStatusCard data={data.crew} />
        <AccountHealthCard data={data.accountHealth} />
      </div>

      {/* Section 2: Secondary metrics — 4 cols desktop / 2 tablet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QualitySnapshotCard data={data.quality} />
        <ARSnapshotCard data={data.ar} />
        <PipelineSnapshotCard data={data.pipeline} />
        <AIInsightCard data={data.ai} />
      </div>
    </PageLayout>
  );
}
