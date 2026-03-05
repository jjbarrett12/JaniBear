/**
 * Add-on feature flags (org-level). Stored in org_features or effective entitlements.
 */

export const FEATURES = [
  'addon.lidar',
  'addon.ai_proposals',
  'addon.helphubqr',
] as const;

export type FeatureKey = (typeof FEATURES)[number];
