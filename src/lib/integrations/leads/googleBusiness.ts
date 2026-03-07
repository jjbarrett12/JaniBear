/**
 * Google Business Profile / Places lead enrichment adapter.
 * Use for map-based prospecting and place details.
 *
 * TODO: Implement when Google Places API is configured:
 * - getPlaceDetails(placeId: string) => PlaceEnrichment
 * - searchNearby(lat, lng, radius) => PlaceSummary[]
 * - rate limits, API key from env
 */

export type GooglePlaceEnrichment = {
  name?: string;
  formattedAddress?: string;
  website?: string;
  phone?: string;
  rating?: number;
  userRatingsCount?: number;
  types?: string[];
};

export async function enrichLeadFromGoogleBusiness(_placeId: string): Promise<GooglePlaceEnrichment> {
  // TODO: call Google Places API when key is configured
  return {};
}
