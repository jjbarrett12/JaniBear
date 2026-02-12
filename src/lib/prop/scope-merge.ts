/**
 * Scope merge: LiDAR + vision + transcript → one scope_models row with surface audit fields.
 * Your rules (e.g. "LiDAR sqft overrides when present") live here.
 * See PROP_LIDAR_SOFTWARE_SYSTEM.md, migration 027_scope_surface_audit_fields.sql.
 */

import type { ExtractedScan, SurfaceSource } from './types';

export interface MergeScopeInput {
  walkthroughId: string;
  orgId: string;
  /** From walkthrough_scans.extracted (latest or aggregated) */
  extracted?: ExtractedScan | null;
  /** From transcript extractScope / existing scope_models */
  transcriptScope?: Record<string, unknown> | null;
  /** Existing scope_models id to update */
  existingScopeId?: string | null;
}

/**
 * Compute merged scope and surface_type_final from LiDAR + transcript.
 * Does NOT write to DB — caller (API route / Edge Function) does that using this result.
 * Stub: returns minimal result. Replace with real merge rules.
 */
export function computeMergedScope(input: MergeScopeInput): {
  extracted_json: Record<string, unknown>;
  surface_type_final: Record<string, number> | null;
  surface_type_predicted: Record<string, number> | null;
  surface_confidence: number | null;
  surface_source: SurfaceSource | null;
} {
  const { extracted, transcriptScope } = input;

  // Stub: prefer extracted rooms if present, else transcript
  const rooms = extracted?.rooms?.length
    ? extracted.rooms
    : (transcriptScope?.rooms as Array<{ name: string; sqft?: number }>) ?? [];

  const total_sqft =
    extracted?.total_sqft ??
    (rooms as Array<{ sqft?: number; floor_area?: number }>).reduce(
      (sum, r) => sum + (r.sqft ?? r.floor_area ?? 0),
      0
    );

  const surface_type_final: Record<string, number> = {};
  for (const r of rooms as Array<{ name?: string; floor_area?: number; sqft?: number; user_surface_tag?: string }>) {
    const tag = r.user_surface_tag ?? 'other';
    const area = r.floor_area ?? r.sqft ?? 0;
    surface_type_final[tag] = (surface_type_final[tag] ?? 0) + area;
  }

  return {
    extracted_json: { rooms, total_sqft },
    surface_type_final: Object.keys(surface_type_final).length ? surface_type_final : null,
    surface_type_predicted: null,
    surface_confidence: null,
    surface_source: null,
  };
}
