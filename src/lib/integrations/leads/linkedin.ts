/**
 * LinkedIn lead enrichment adapter (e.g. Sales Navigator, LinkedIn API).
 * Use for contact title and company data.
 *
 * TODO: Implement when LinkedIn API/partner integration is available:
 * - getProfileByUrl(linkedInUrl: string) => LinkedInProfile
 * - rate limits, OAuth or API key from env
 */

export type LinkedInProfileEnrichment = {
  firstName?: string;
  lastName?: string;
  title?: string;
  companyName?: string;
  profileUrl?: string;
};

export async function enrichLeadFromLinkedIn(_linkedInUrl: string): Promise<LinkedInProfileEnrichment> {
  // TODO: call LinkedIn API when configured
  return {};
}
