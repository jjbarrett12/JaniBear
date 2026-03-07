/**
 * ZoomInfo lead enrichment adapter.
 * Do not hard-wire ZoomInfo into core sales logic; use this adapter for enrichment.
 * Map ZoomInfo responses to NormalizedLeadEnrichment for core consumption.
 *
 * TODO: Implement when ZoomInfo API is available:
 * - getCompanyByDomain(domain: string) => CompanyEnrichment
 * - getContactByEmail(email: string) => ContactEnrichment
 * - rate limits, API key from env
 */

import type { NormalizedLeadEnrichment } from '@/lib/sales/types';

export type ZoomInfoCompanyEnrichment = {
  name?: string;
  website?: string;
  employeeCount?: number;
  industry?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

export type ZoomInfoContactEnrichment = {
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
};

export async function enrichLeadFromZoomInfo(_email?: string | null, _companyDomain?: string | null): Promise<{
  company?: ZoomInfoCompanyEnrichment;
  contact?: ZoomInfoContactEnrichment;
}> {
  // TODO: call ZoomInfo API when key is configured
  return {};
}

/** Map ZoomInfo response to normalized shape for core sales (do not hardwire in core). */
export function zoomInfoToNormalized(_company?: ZoomInfoCompanyEnrichment, _contact?: ZoomInfoContactEnrichment): NormalizedLeadEnrichment {
  return {};
}
