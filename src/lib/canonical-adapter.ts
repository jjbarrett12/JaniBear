/**
 * Compatibility adapters: map legacy location/site/facility rows to canonical types.
 * Use when migrating components to canonical language without changing API/DB yet.
 */

import type { CanonicalServiceAddress } from '@/types/canonical-domain';

/** Facility row (from facilities table) → CanonicalServiceAddress */
export function facilityToServiceAddress(row: {
  id: string;
  name: string;
  account_id: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  is_primary?: boolean;
}): CanonicalServiceAddress {
  return {
    id: row.id,
    name: row.name,
    accountId: row.account_id,
    addressLine1: row.address_line1 ?? null,
    addressLine2: row.address_line2 ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    isPrimary: row.is_primary ?? false,
  };
}

/** Legacy location row (locations table) → CanonicalServiceAddress. Use when DB still has locations. */
export function locationToServiceAddress(row: {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  org_id: string;
} & { account_id?: string }): CanonicalServiceAddress {
  return {
    id: row.id,
    name: row.name,
    accountId: (row as { account_id?: string }).account_id ?? '',
    addressLine1: (row as { address?: string | null }).address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    zip: row.zip ?? null,
    isPrimary: true,
  };
}
