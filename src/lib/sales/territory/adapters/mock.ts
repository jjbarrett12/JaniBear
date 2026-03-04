/**
 * Mock/sample data for Territory War Board. Used when real API is unavailable or behind feature flags.
 */

import type { MapPin } from '../types';
import type { BuildingIntel } from '../types';
import type { HeatMetricCell } from '../types';

export async function getPinsFromAdapter(orgId: string): Promise<MapPin[]> {
  if (typeof orgId !== 'string' || !orgId) return [];
  return [
    {
      id: 'pin-1',
      name: 'Riverside Office Park',
      lat: 40.7128,
      lng: -74.006,
      type: 'prospect',
      stage: 'proposal_sent',
      zip: '10001',
      sqft: 45000,
      estValueMonthly: 4200,
    },
    {
      id: 'pin-2',
      name: 'Downtown Tower A',
      lat: 40.72,
      lng: -74.01,
      type: 'client',
      zip: '10002',
      sqft: 62000,
      estValueMonthly: 5800,
    },
  ];
}

export async function getHeatMetricsFromAdapter(_orgId: string): Promise<HeatMetricCell[]> {
  return [
    {
      cellId: 'cell-1',
      bounds: { north: 40.72, south: 40.71, east: -74.0, west: -74.02 },
      metrics: {
        highMargin: 0.7,
        churnRisk: 0.2,
        closeRate: 0.65,
        underserved: 0.4,
        competitorSat: 0.3,
        activeBids: 0.5,
        coldLeads: 0.2,
      },
    },
  ];
}

export async function getBuildingIntelFromAdapter(_orgId: string, buildingId: string): Promise<BuildingIntel | null> {
  return {
    id: buildingId,
    name: 'Riverside Office Park',
    sqft: 45000,
    estValueMonthly: 4200,
    marginPotentialPct: 28,
    competitorsNearby: '2 competitors nearby',
    similarWinsInZip: 4,
    riskScore: 'low',
    suggestedTemplate: 'Standard Office 40K',
  };
}
