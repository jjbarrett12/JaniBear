import { requireOrg } from '@/lib/auth';
import { getTerritoryMapData } from '@/lib/territory-map-data';
import { TerritoryMapPage } from '@/components/territory-map/TerritoryMapPage';

export default async function TerritoryMapRoute() {
  const org = await requireOrg();
  const data = await getTerritoryMapData(org.org_id);

  return <TerritoryMapPage data={data} orgId={org.org_id} />;
}
