/**
 * Proprietary LiDAR/scan/scope types — single source of truth for the "prop" pipeline.
 * See repo root PROP_LIDAR_SOFTWARE_SYSTEM.md.
 */

export type SurfaceType = 'carpet' | 'tile' | 'lvt' | 'wood' | 'concrete' | 'other';

export interface ExtractedRoom {
  name: string;
  sqft?: number;
  floor_area: number;
  room_polygon?: unknown;
  frames?: string[];
  user_surface_tag?: SurfaceType;
  surface_prediction?: SurfaceType;
  surface_confidence?: number;
  surfaces?: number;
}

export interface ExtractedScan {
  rooms: ExtractedRoom[];
  total_sqft: number;
  surfaces?: number;
}

export interface SurfaceClassifierResult {
  surface_prediction: SurfaceType;
  confidence: number;
}

export type SurfaceSource = 'manual' | 'ai_suggested' | 'ai_confirmed';

export interface ScopeMergeInput {
  walkthroughId: string;
  orgId: string;
  /** Latest scan extracted data (or aggregated from multiple scans) */
  extracted?: ExtractedScan | null;
  /** Transcript-derived scope if any */
  transcriptScope?: Record<string, unknown> | null;
  /** Existing scope_models row id to update, or undefined to insert */
  existingScopeId?: string | null;
}

export interface BidLineItem {
  description: string;
  surface_type?: SurfaceType;
  sqft: number;
  rate?: number;
  amount: number;
}
