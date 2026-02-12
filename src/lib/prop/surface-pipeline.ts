/**
 * Surface classifier: RGB frames → surface type + confidence.
 * Proprietary IP or vendor integration lives here.
 * See PROP_LIDAR_SOFTWARE_SYSTEM.md, LIDAR_AND_SURFACE_STRATEGY.md.
 */

import type { SurfaceClassifierResult, SurfaceType } from './types';

export interface RunSurfaceClassifierInput {
  /** Storage paths or URLs to preview/frame images */
  framePaths: string[];
}

/**
 * Run surface classification on frames. Returns best guess + confidence.
 * Stub: returns 'other' with 0 confidence. Replace with real model or API.
 */
export async function runSurfaceClassifier(
  _input: RunSurfaceClassifierInput
): Promise<SurfaceClassifierResult> {
  // TODO: Load images, run segmentation/classifier (on-device or server)
  return {
    surface_prediction: 'other' as SurfaceType,
    confidence: 0,
  };
}
