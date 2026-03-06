import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getTerritoryMapData } from '@/lib/territory-map-data';
import { TerritoryMapPage } from '@/components/territory-map/TerritoryMapPage';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';

/**
 * Sales War Room: Territory Map with heat layers and building intelligence cards.
 * Same data and component as /app/map; use Sales mode. Requires maps.read.
 */
export default async function SalesTerritoryPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'maps.read' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }
  const data = await getTerritoryMapData(org.org_id);
  return <TerritoryMapPage data={data} orgId={org.org_id} initialMode="sales" />;
}
