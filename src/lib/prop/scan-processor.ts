/**
 * Scan processor: raw scan (.usdz / mesh) → structured extracted data.
 * Proprietary IP lives here or in a replacement implementation.
 * See PROP_LIDAR_SOFTWARE_SYSTEM.md.
 */

import type { ExtractedScan } from './types';

export interface ProcessScanInput {
  scanId: string;
  /** Storage paths: roomplan_raw_path, preview_images[] */
  roomplanPath: string | null;
  previewPaths: string[];
}

/**
 * Process a scan and return extracted geometry/rooms.
 * Stub: returns minimal shape. Replace with real .usdz/mesh parsing.
 */
export async function processScan(input: ProcessScanInput): Promise<ExtractedScan> {
  // TODO: Download from storage, parse .usdz or mesh, compute rooms + floor_area
  const { scanId } = input;
  return {
    rooms: [
      { name: 'Room 1', floor_area: 0, sqft: 0 },
    ],
    total_sqft: 0,
    surfaces: 0,
  };
}
