/**
 * Bid/line-item derivation: scope_models (surface_type_final + sqft) → line items.
 * Your pricing and category logic lives here.
 * See PROP_LIDAR_SOFTWARE_SYSTEM.md.
 */

import type { BidLineItem, SurfaceType } from './types';

export interface DeriveBidInput {
  /** scope_models.surface_type_final e.g. { carpet: 5000, tile: 3000 } */
  surface_type_final: Record<string, number> | null;
  /** scope_models.extracted_json or total_sqft */
  total_sqft?: number;
  /** Optional: org-specific or tier-specific rates (future) */
  rates?: Partial<Record<SurfaceType, number>>;
}

/**
 * Derive bid line items from surface breakdown and optional rates.
 * Stub: returns one line per surface type with placeholder rate. Replace with real pricing.
 */
export function deriveBidLineItems(input: DeriveBidInput): BidLineItem[] {
  const { surface_type_final, total_sqft = 0, rates = {} } = input;
  const items: BidLineItem[] = [];

  if (surface_type_final && Object.keys(surface_type_final).length > 0) {
    for (const [surface, sqft] of Object.entries(surface_type_final)) {
      const rate = rates[surface as SurfaceType] ?? 0;
      items.push({
        description: `${surface} (${sqft} sq ft)`,
        surface_type: surface as SurfaceType,
        sqft,
        rate: rate || undefined,
        amount: rate ? sqft * rate : 0,
      });
    }
  } else if (total_sqft > 0) {
    items.push({
      description: `Floor area (${total_sqft} sq ft)`,
      sqft: total_sqft,
      amount: 0,
    });
  }

  return items;
}
