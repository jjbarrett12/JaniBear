import { requireOrg } from '@/lib/auth';
import { getTerritoryMapData } from '@/lib/territory-map-data';
import { TerritoryMapPage } from '@/components/territory-map/TerritoryMapPage';

/**
 * Sales War Room: Territory Map with heat layers and building intelligence cards.
 * Same data and component as /app/territory-map and /app/map; use Sales mode for war board.
 */
export default async function SalesTerritoryPage() {
  const org = await requireOrg();
  const data = await getTerritoryMapData(org.org_id);

  return <TerritoryMapPage data={data} orgId={org.org_id} initialMode="sales" />;
}
