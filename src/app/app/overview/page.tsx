import { requireOrg } from '@/lib/auth';
import { getOverviewData } from '@/lib/overview-data';
import { OverviewContent } from '@/components/overview/OverviewContent';

export const revalidate = 60;

/**
 * Overview — executive snapshot (trend + business health).
 * Tiles: MRR, gross margin %, retention/churn risk, pipeline, utilization 30d, AR, accounts at risk, service delivery.
 * Then trends strip, operational risk panel, financial health panel.
 */
export default async function OverviewPage() {
  const org = await requireOrg();
  const data = await getOverviewData(org.org_id);

  return <OverviewContent data={data} />;
}
