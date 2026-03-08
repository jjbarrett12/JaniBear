/**
 * Canonical domain types for JANIBEAR customer and operations language.
 * Use these for new code and UI; legacy types (location, site) remain for DB/API compatibility.
 *
 * Lifecycle: Lead → Walkthrough → Proposal → (New) Account → Active Account → Attrition | Past Accounts
 * Account = primary customer object. Service Address = physical address. Area/Zone/Floor/Space = subdivisions.
 */

/** Lifecycle status for accounts (align with accounts.status where applicable). */
export type AccountStatus =
  | 'active'      // In service
  | 'inactive'    // Paused or not yet started
  | 'cancelled'   // Contract ended by choice
  | 'attrition'   // Lost / churned
  | 'past';       // Historical; no longer active

/** Subdivision of a service address for mapping, LiDAR, or inspections. */
export type ServiceAddressSubdivisionType = 'area' | 'zone' | 'floor' | 'space';

export interface CanonicalLead {
  id: string;
  /** ... extend from leads table as needed */
}

export interface CanonicalWalkthrough {
  id: string;
  /** ... extend from walkthroughs table as needed */
}

export interface CanonicalProposal {
  id: string;
  /** ... extend from proposals/bids as needed */
}

/** Canonical account (customer) — maps to accounts table. */
export interface CanonicalAccount {
  id: string;
  name: string;
  status: AccountStatus;
  /** Service addresses (facilities) under this account */
  serviceAddressIds?: string[];
}

/** Canonical service address — maps to facilities table (or locations in legacy). */
export interface CanonicalServiceAddress {
  id: string;
  name: string;
  accountId: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  isPrimary?: boolean;
  /** Optional subdivisions (areas, zones, floors, spaces) */
  subdivisionIds?: string[];
}

/** Subdivision (area, zone, floor, space) for mapping/LiDAR/inspections. */
export interface CanonicalServiceAddressSubdivision {
  id: string;
  serviceAddressId: string;
  type: ServiceAddressSubdivisionType;
  name: string;
}
