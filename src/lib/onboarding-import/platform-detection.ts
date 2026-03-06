/**
 * Platform Detection Engine for the JANIBEAR importer.
 *
 * 1. Normalizes spreadsheet headers (lowercase, remove punctuation/underscores, collapse spaces).
 * 2. Compares against known platform signatures (expected header names).
 * 3. Confidence = matchedHeaders / signatureHeaders. If > 0.6, classify as that platform.
 * 4. Returns { platform, confidence, matched_headers }; else default to generic_spreadsheet.
 * 5. When a platform is detected, getMappingTemplateForPlatform() provides a column mapping template.
 * 6. User can override via overridePlatform in the detect API.
 */

import type { MappableField } from './schemas';
import { normalizeHeader } from './normalize';

/**
 * Normalize header for platform comparison: lowercase, remove punctuation and underscores (to space), collapse spaces.
 * Enables "Account Name", "Account_Name", and "account.name" to all match signature "account name".
 */
export function normalizeHeaderForDetection(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[.,\-/\\'_"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const DETECTABLE_PLATFORMS = ['jobber', 'zenmaid', 'swept', 'generic_spreadsheet'] as const;
export type DetectablePlatform = (typeof DETECTABLE_PLATFORMS)[number];

/** Expected header names per platform (normalized form for matching: lowercase, no punctuation). */
export const PLATFORM_SIGNATURES: Record<Exclude<DetectablePlatform, 'generic_spreadsheet'>, string[]> = {
  jobber: [
    'company name',
    'client name',
    'first name',
    'last name',
    'property name',
    'property address',
    'address',
    'street',
    'city',
    'state',
    'province',
    'postal code',
    'zip',
    'country',
    'email',
    'phone',
    'mobile',
    'tags',
    'notes',
  ],
  zenmaid: [
    'client',
    'customer',
    'customer name',
    'address',
    'street address',
    'city',
    'state',
    'zip',
    'email',
    'phone',
    'cleaner',
    'cleaners',
    'team',
    'assignment',
    'appointment',
    'service',
    'frequency',
    'schedule',
  ],
  swept: [
    'account name',
    'location name',
    'location',
    'site name',
    'address',
    'street',
    'city',
    'state',
    'postal code',
    'zip',
    'team',
    'cleaner',
    'contact',
    'contact name',
    'phone',
    'email',
    'frequency',
    'schedule',
    'time zone',
  ],
};

/** Mapping template: JANIBEAR field -> possible header names (normalized for matching). */
const MAPPING_TEMPLATES: Record<
  Exclude<DetectablePlatform, 'generic_spreadsheet'>,
  Partial<Record<MappableField, string[]>>
> = {
  jobber: {
    customer_name: ['company name', 'client name', 'client', 'customer'],
    building_name: ['property name', 'property', 'property address'],
    address: ['address', 'street', 'property address', 'street address'],
    contact_name: ['first name', 'last name', 'name', 'contact name'],
    contact_email: ['email'],
    contact_phone: ['phone', 'mobile', 'main phone'],
    operator_name: ['team', 'assigned to'],
    service_schedule_raw: ['frequency', 'schedule', 'visit frequency'],
    start_time: ['start time', 'preferred time'],
  },
  zenmaid: {
    customer_name: ['customer', 'customer name', 'client', 'client name'],
    building_name: ['address', 'location', 'property'],
    address: ['street address', 'address', 'street'],
    contact_name: ['contact', 'contact name'],
    contact_email: ['email'],
    contact_phone: ['phone'],
    operator_name: ['cleaner', 'cleaners', 'team', 'assigned cleaner'],
    service_schedule_raw: ['frequency', 'schedule', 'service frequency'],
    start_time: ['time', 'appointment time'],
  },
  swept: {
    customer_name: ['account name', 'account', 'client'],
    building_name: ['location name', 'location', 'site name', 'site'],
    address: ['address', 'street', 'city', 'state', 'postal code', 'zip'],
    contact_name: ['contact', 'contact name'],
    contact_email: ['email'],
    contact_phone: ['phone'],
    operator_name: ['team', 'cleaner'],
    service_schedule_raw: ['frequency', 'schedule'],
    start_time: ['start time'],
  },
};

export interface PlatformDetectionResult {
  platform: DetectablePlatform;
  confidence: number;
  matched_headers: string[];
}

const CONFIDENCE_THRESHOLD = 0.6;

/**
 * Detect platform from spreadsheet headers.
 * Headers can be raw (e.g. "Account Name") or pre-normalized.
 * Returns platform and confidence; if none exceeds threshold, returns generic_spreadsheet.
 */
export function detectPlatform(rawHeaders: string[]): PlatformDetectionResult {
  const normalized = rawHeaders.map((h) => normalizeHeaderForDetection(h));
  const normalizedSet = new Set(normalized);

  let best: { platform: Exclude<DetectablePlatform, 'generic_spreadsheet'>; confidence: number; matched: string[] } = {
    platform: 'jobber',
    confidence: 0,
    matched: [],
  };

  for (const platform of ['jobber', 'zenmaid', 'swept'] as const) {
    const signature = PLATFORM_SIGNATURES[platform];
    const matched: string[] = [];
    for (const sig of signature) {
      if (normalizedSet.has(sig)) matched.push(sig);
    }
    const confidence = signature.length > 0 ? matched.length / signature.length : 0;
    if (confidence > best.confidence) {
      best = { platform, confidence, matched };
    }
  }

  if (best.confidence <= CONFIDENCE_THRESHOLD) {
    return {
      platform: 'generic_spreadsheet',
      confidence: 0,
      matched_headers: [],
    };
  }

  return {
    platform: best.platform,
    confidence: Math.round(best.confidence * 100) / 100,
    matched_headers: best.matched,
  };
}

/**
 * Build a column mapping from detected platform and actual file headers.
 * Maps JANIBEAR field -> normalized column key (as used in row objects).
 * actualColumns: raw headers from the file (e.g. ["Account Name", "Location"]).
 * Returns Record<janibear_field, normalized_header_key> for columns that matched.
 */
export function getMappingTemplateForPlatform(
  platform: Exclude<DetectablePlatform, 'generic_spreadsheet'>,
  actualColumns: string[]
): Record<string, string> {
  const template = MAPPING_TEMPLATES[platform];
  if (!template) return {};

  const normalizedToRaw = new Map<string, string>();
  actualColumns.forEach((h) => {
    const n = normalizeHeaderForDetection(h);
    if (!normalizedToRaw.has(n)) normalizedToRaw.set(n, h);
  });
  const rawToNormalizedKey = new Map<string, string>();
  actualColumns.forEach((h) => {
    rawToNormalizedKey.set(h, normalizeHeader(h));
  });

  const mapping: Record<string, string> = {};
  for (const [field, possibleHeaders] of Object.entries(template)) {
    if (!possibleHeaders || !Array.isArray(possibleHeaders)) continue;
    for (const possible of possibleHeaders) {
      const raw = normalizedToRaw.get(possible);
      if (raw) {
        mapping[field] = normalizeHeader(raw);
        break;
      }
    }
  }
  return mapping;
}
