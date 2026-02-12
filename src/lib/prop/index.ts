/**
 * JANIBEAR Proprietary LiDAR/scan/scope pipeline.
 * Clear interfaces; implementations are stubs until real algorithms are added.
 * See repo root PROP_LIDAR_SOFTWARE_SYSTEM.md.
 */

export * from './types';
export { processScan } from './scan-processor';
export type { ProcessScanInput } from './scan-processor';
export { runSurfaceClassifier } from './surface-pipeline';
export type { RunSurfaceClassifierInput } from './surface-pipeline';
export { computeMergedScope } from './scope-merge';
export type { MergeScopeInput } from './scope-merge';
export { deriveBidLineItems } from './bid-derivation';
export type { DeriveBidInput } from './bid-derivation';
