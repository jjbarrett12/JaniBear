/**
 * GRIZZLY: Duplicate detection for leads.
 * Detect by: company+city/state, website, email, phone, address, google_place_id.
 * Flag possible duplicates; allow link existing account, ignore, merge later, or continue with confirmation.
 */

import type { LeadRecord } from './types';

export interface DuplicateMatch {
  leadId: string;
  company?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  matchReasons: ('company_location' | 'website' | 'email' | 'phone' | 'address' | 'google_place_id')[];
  score: number;
}

/**
 * Build a key for grouping possible duplicates (normalized).
 */
export function duplicateGroupKey(lead: Partial<LeadRecord>): string | null {
  const parts: string[] = [];
  const company = normalizeForMatch(lead.company ?? lead.legal_business_name);
  const city = normalizeForMatch(lead.city);
  const state = normalizeForMatch(lead.state);
  const email = normalizeForMatch(lead.email);
  const phone = normalizePhone(lead.phone ?? lead.mobile);
  const website = normalizeWebsite(lead.website);
  const placeId = lead.google_place_id?.trim();

  if (company && (city || state)) parts.push(`co:${company}|${city ?? ''}|${state ?? ''}`);
  if (email) parts.push(`em:${email}`);
  if (phone) parts.push(`ph:${phone}`);
  if (website) parts.push(`web:${website}`);
  if (placeId) parts.push(`place:${placeId}`);

  if (parts.length === 0) return null;
  return parts.sort().join(';');
}

function normalizeForMatch(s: string | null | undefined): string {
  if (!s?.trim()) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhone(s: string | null | undefined): string {
  if (!s?.trim()) return '';
  return s.replace(/\D/g, '').slice(-10) || '';
}

function normalizeWebsite(s: string | null | undefined): string {
  if (!s?.trim()) return '';
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    return (u.hostname || '').replace(/^www\./, '');
  } catch {
    return normalizeForMatch(s);
  }
}

/**
 * Check for possible duplicates of this lead in the same org.
 * Returns list of candidate leads with match reasons and a simple score.
 */
export function findDuplicateCandidates(
  lead: Partial<LeadRecord>,
  candidates: LeadRecord[],
  excludeLeadId?: string
): DuplicateMatch[] {
  const out: DuplicateMatch[] = [];
  const company = normalizeForMatch(lead.company ?? (lead as { legal_business_name?: string }).legal_business_name);
  const city = normalizeForMatch(lead.city);
  const state = normalizeForMatch(lead.state);
  const email = normalizeForMatch(lead.email);
  const phone = normalizePhone(lead.phone ?? (lead as { mobile?: string }).mobile);
  const website = normalizeWebsite(lead.website);
  const placeId = lead.google_place_id?.trim();
  const address = normalizeForMatch(lead.address ?? (lead as { address_line_1?: string }).address_line_1);

  for (const c of candidates) {
    if (c.id === excludeLeadId || c.id === lead.id) continue;

    const reasons: DuplicateMatch['matchReasons'] = [];
    if (company && (city || state)) {
      const cCompany = normalizeForMatch(c.company ?? (c as { legal_business_name?: string }).legal_business_name);
      const cCity = normalizeForMatch(c.city);
      const cState = normalizeForMatch(c.state);
      if (cCompany === company && (cCity === city || cState === state)) reasons.push('company_location');
    }
    if (website) {
      const cWeb = normalizeWebsite(c.website);
      if (cWeb && cWeb === website) reasons.push('website');
    }
    if (email) {
      const cEm = normalizeForMatch(c.email);
      if (cEm && cEm === email) reasons.push('email');
    }
    if (phone) {
      const cPh = normalizePhone(c.phone ?? (c as { mobile?: string }).mobile);
      if (cPh && cPh === phone) reasons.push('phone');
    }
    if (address) {
      const cAddr = normalizeForMatch(c.address ?? (c as { address_line_1?: string }).address_line_1);
      if (cAddr && cAddr === address) reasons.push('address');
    }
    if (placeId && (c as { google_place_id?: string }).google_place_id === placeId) reasons.push('google_place_id');

    if (reasons.length === 0) continue;

    const score = reasons.length * 20 + (reasons.includes('email') || reasons.includes('phone') ? 20 : 0);
    out.push({
      leadId: c.id,
      company: c.company,
      contactName: c.contact_name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      state: c.state,
      matchReasons: reasons,
      score: Math.min(100, score),
    });
  }

  return out.sort((a, b) => b.score - a.score);
}
