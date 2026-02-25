/**
 * Territory War Board: typed data shapes for pins, heat, and building intel.
 */

import type { LayerId } from './salesTerritoryConfig';

export type MapPinType = 'prospect' | 'client';

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: MapPinType;
  stage?: string | null;
  zip?: string | null;
  sqft?: number | null;
  estValueMonthly?: number | null;
}

export interface HeatLayer {
  id: LayerId;
  label: string;
  enabled: boolean;
}

export interface HeatMetricCell {
  cellId: string;
  bounds: { north: number; south: number; east: number; west: number };
  metrics: {
    highMargin: number;
    churnRisk: number;
    closeRate: number;
    underserved: number;
    competitorSat: number;
    activeBids: number;
    coldLeads: number;
  };
}

export interface BuildingIntel {
  id: string;
  name: string;
  sqft: number | null;
  estValueMonthly: number | null;
  marginPotentialPct: number | null;
  competitorsNearby: string | null;
  similarWinsInZip: number | null;
  riskScore: 'low' | 'medium' | 'high' | null;
  suggestedTemplate: string | null;
}

/** Canonical field spec for intel card: key maps to BuildingIntel, label for display, value is resolved at render. */
export interface BuildingIntelFieldSpec {
  key: keyof BuildingIntel;
  label: string;
}
