import { redirect } from 'next/navigation';

/**
 * Canonical map is /app/map. Redirect to avoid two competing map systems.
 */
export default function TerritoryMapRoute() {
  redirect('/app/map');
}
