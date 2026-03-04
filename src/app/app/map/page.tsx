import { requireOrg } from '@/lib/auth';
import { getTerritoryMapData } from '@/lib/territory-map-data';
import { TerritoryMapPage } from '@/components/territory-map/TerritoryMapPage';

/**
 * Map module (Executive): Sales mode = graph areas, territories, prospects.
 * Operations mode = map crews, customers, sites, franchisees.
 */
export default async function MapPage() {
  const org = await requireOrg();
  const data = await getTerritoryMapData(org.org_id);

  return <TerritoryMapPage data={data} orgId={org.org_id} />;
}
