'use client';

import { type ReactNode } from 'react';

/**
 * Feature gate: hides UI when the feature is not enabled for the tenant.
 * Security: APIs must enforce via requireFeature() / requirePermission() — this only hides UI.
 *
 * Usage (from a Server Component that has resolved access):
 *   const access = await getEffectiveAccessForCurrentUser();
 *   return (
 *     <FeatureGate feature="lidar" allowed={hasFeature(access, 'lidar')}>
 *       <LidarModule />
 *     </FeatureGate>
 *   );
 *
 * Or with fallback:
 *   <FeatureGate feature="helphub_qr" allowed={hasFeature(access, 'helphub_qr')} fallback={<UpgradeCta />}>
 *     <HelpHubQRContent />
 *   </FeatureGate>
 */
type FeatureGateProps = {
  /** Feature code (e.g. 'lidar', 'helphub_qr') — for semantics; actual gate is `allowed`. */
  feature: string;
  /** Resolved from server: hasFeature(access, feature). Must be passed from Server Component. */
  allowed: boolean;
  /** Optional content when feature is not allowed (e.g. upgrade CTA). */
  fallback?: ReactNode;
  children: ReactNode;
};

export function FeatureGate({ feature: _feature, allowed, fallback = null, children }: FeatureGateProps) {
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
