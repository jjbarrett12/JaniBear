/**
 * Feature flags for Territory War Board. Env or override.
 * TERRITORY_WAR_LAYERS_ENABLED: heat layer toggles + overlay.
 * BUILDING_INTEL_CARD_ENABLED: floating Building Intel Card on pin click.
 */

export const TERRITORY_WAR_LAYERS_ENABLED =
  process.env.NEXT_PUBLIC_TERRITORY_WAR_LAYERS_ENABLED !== 'false';

export const BUILDING_INTEL_CARD_ENABLED =
  process.env.NEXT_PUBLIC_BUILDING_INTEL_CARD_ENABLED !== 'false';
