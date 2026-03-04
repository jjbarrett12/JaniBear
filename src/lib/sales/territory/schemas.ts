/**
 * Zod schemas for Territory War Board. Validate at runtime; use safe parse and fallbacks.
 */

import { z } from 'zod';
import { LAYER_IDS } from './salesTerritoryConfig';

export const mapPinTypeSchema = z.enum(['prospect', 'client']);

export const mapPinSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: mapPinTypeSchema,
  stage: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  sqft: z.number().nullable().optional(),
  estValueMonthly: z.number().nullable().optional(),
});

export const heatMetricCellSchema = z.object({
  cellId: z.string(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
  metrics: z.object({
    highMargin: z.number(),
    churnRisk: z.number(),
    closeRate: z.number(),
    underserved: z.number(),
    competitorSat: z.number(),
    activeBids: z.number(),
    coldLeads: z.number(),
  }),
});

export const riskScoreSchema = z.enum(['low', 'medium', 'high']);

export const buildingIntelSchema = z.object({
  id: z.string(),
  name: z.string(),
  sqft: z.number().nullable(),
  estValueMonthly: z.number().nullable(),
  marginPotentialPct: z.number().nullable(),
  competitorsNearby: z.string().nullable(),
  similarWinsInZip: z.number().nullable(),
  riskScore: riskScoreSchema.nullable(),
  suggestedTemplate: z.string().nullable(),
});

export const layerIdSchema = z.enum(LAYER_IDS);

export type MapPinInput = z.infer<typeof mapPinSchema>;
export type BuildingIntelInput = z.infer<typeof buildingIntelSchema>;
export type HeatMetricCellInput = z.infer<typeof heatMetricCellSchema>;
