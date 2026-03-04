import { requireOrg } from '@/lib/auth';
import { PageLayout } from '@/components/enterprise';
import { AlertsCenter } from '@/components/alerts/AlertsCenter';
import { RiskRadarPanel } from '@/components/alerts/RiskRadarPanel';

export default async function AlertsPage() {
  const org = await requireOrg();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Alerts & Risk Radar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and act on alerts from account health, inspections, AR aging, and more.
          </p>
        </div>

        <RiskRadarPanel orgId={org.org_id} />
        <AlertsCenter orgId={org.org_id} />
      </div>
    </PageLayout>
  );
}
