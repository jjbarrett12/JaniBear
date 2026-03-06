import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getTerritoryMapData } from '@/lib/territory-map-data';
import { TerritoryMapPage } from '@/components/territory-map/TerritoryMapPage';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import type { MapMode } from '@/types/territory-map';

type PageProps = { searchParams: Promise<{ sales?: string; ops?: string }> };

/**
 * Unified Map (Sales + Ops). Requires maps.read.
 * /app/map?sales=true → Sales mode (leads + territories). /app/map?ops=true → Operations mode (accounts, crews, franchisees, service areas).
 */
export default async function MapPage({ searchParams }: PageProps) {
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
  const params = await searchParams;
  const initialMode: MapMode = params.sales === 'true' ? 'sales' : params.ops === 'true' ? 'ops' : 'ops';
  const data = await getTerritoryMapData(org.org_id, { userId: userId ?? undefined });
  return <TerritoryMapPage data={data} orgId={org.org_id} initialMode={initialMode} />;
}
