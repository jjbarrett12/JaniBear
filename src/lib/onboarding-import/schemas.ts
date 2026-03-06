/**
 * Zod schemas for onboarding import: AI mapping response and batch types.
 */

import { z } from 'zod';

/** Entity types we can create during import (for import_batch_items and rollback). */
export const IMPORT_ENTITY_TYPES = ['accounts', 'facilities', 'crews'] as const;
export type ImportEntityType = (typeof IMPORT_ENTITY_TYPES)[number];

/** Fields the LLM can map from spreadsheet columns to JANIBEAR entities. */
export const MAPPABLE_FIELDS = [
  'customer_name',
  'building_name',
  'address',
  'contact_name',
  'contact_email',
  'contact_phone',
  'operator_name',
  'service_schedule_raw',
  'start_time',
] as const;
export type MappableField = (typeof MAPPABLE_FIELDS)[number];

/** service_frequency_per_week enum for facilities. */
export const SERVICE_FREQUENCY_PER_WEEK = ['1xweek', '2xweek', '3xweek', '4xweek', '5xweek', '6xweek', '7xweek'] as const;
export type ServiceFrequencyPerWeek = (typeof SERVICE_FREQUENCY_PER_WEEK)[number];

/** Strict JSON shape returned by the LLM for column mapping. */
export const aiMappingResponseSchema = z.object({
  mappings: z.record(z.string(), z.string()),
  confidence: z.record(z.string(), z.number().min(0).max(1)),
  notes: z.array(z.string()),
  needs_user_input: z.array(z.string()),
});

export type AIMappingResponse = z.infer<typeof aiMappingResponseSchema>;

/** User-confirmed mapping (column header -> JANIBEAR field). */
export const confirmedMappingSchema = z.record(z.string(), z.string());
export type ConfirmedMapping = z.infer<typeof confirmedMappingSchema>;

/** Import batch status. */
export const importBatchStatusSchema = z.enum([
  'uploaded',
  'mapped',
  'importing',
  'done',
  'failed',
  'rolled_back',
]);
export type ImportBatchStatus = z.infer<typeof importBatchStatusSchema>;
