/**
 * Normalize headers and values for idempotent import (dedupe by normalized key).
 */

/** Normalize header: trim, lowercase, replace punctuation/spaces with underscore. */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s.,\-/]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || header;
}

/** Normalize a string for dedupe (e.g. account name, address). */
export function normalizeForDedupe(value: string | null | undefined): string {
  if (value == null) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 500);
}

/** Build a row object with normalized keys from raw headers and values. */
export function rowWithNormalizedKeys(
  headers: string[],
  values: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((h, i) => {
    const key = normalizeHeader(h);
    if (key) out[key] = values[i]?.trim() ?? '';
  });
  return out;
}
