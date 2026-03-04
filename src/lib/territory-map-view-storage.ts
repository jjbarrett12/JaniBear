/**
 * Persist map center + zoom so the territory map restores the same view when the user returns.
 * Keyed by orgId so each org's map view is stored separately.
 */

const STORAGE_KEY_PREFIX = 'janibear_territory_map_view_';

export interface SavedMapView {
  center: [number, number];
  zoom: number;
}

export function getSavedMapView(orgId: string): SavedMapView | null {
  if (typeof window === 'undefined' || !orgId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${orgId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as SavedMapView).center) &&
      (parsed as SavedMapView).center.length === 2 &&
      typeof (parsed as SavedMapView).zoom === 'number'
    ) {
      const { center, zoom } = parsed as SavedMapView;
      const lat = center[0];
      const lng = center[1];
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && zoom >= 1 && zoom <= 20) {
        return { center: [lat, lng], zoom };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setSavedMapView(orgId: string, view: SavedMapView): void {
  if (typeof window === 'undefined' || !orgId) return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${orgId}`, JSON.stringify(view));
  } catch {
    /* ignore */
  }
}
