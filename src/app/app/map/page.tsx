import { requireOrg } from '@/lib/auth';
import { MapView } from '@/components/map/map-view';

/**
 * Map: customer locations and crews (operator/franchisee) or franchisee orgs (franchisor).
 * JaniBear OS: franchisors see franchisees only; operators see locations + crew assignments.
 */
export default async function MapPage() {
  await requireOrg();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Map</h1>
        <p className="text-muted-foreground">
          Customer locations and crews for sales targeting and operations. Franchisors see franchisee locations.
        </p>
      </div>
      <MapView />
    </div>
  );
}
