/**
 * Transparent first-pass lead scoring (0–100).
 * Used for lead_score and qualification_score in list/detail views.
 */

import type { LeadRecord } from './types';

const MAX_LEAD_SCORE = 100;
const MAX_QUALIFICATION_SCORE = 100;

/** Inputs that contribute to lead_score (fit, data quality, engagement) */
function leadScoreInputs(lead: Partial<LeadRecord>): { label: string; points: number; max: number }[] {
  const inputs: { label: string; points: number; max: number }[] = [];

  // Valid contact data (email or phone)
  const hasContact = !!(lead.email?.trim() || lead.phone?.trim());
  inputs.push({ label: 'Contact data', points: hasContact ? 15 : 0, max: 15 });

  // Geography (address or city/state/zip)
  const hasGeo = !!(lead.address?.trim() || (lead.city?.trim() && lead.state?.trim()) || lead.zip?.trim());
  inputs.push({ label: 'Geography', points: hasGeo ? 10 : 0, max: 10 });

  // Estimated building size (sq ft)
  const sqft = lead.estimated_sq_ft != null && lead.estimated_sq_ft > 0 ? lead.estimated_sq_ft : 0;
  let sqftPoints = 0;
  if (sqft >= 50000) sqftPoints = 15;
  else if (sqft >= 20000) sqftPoints = 12;
  else if (sqft >= 10000) sqftPoints = 8;
  else if (sqft >= 5000) sqftPoints = 5;
  inputs.push({ label: 'Building size', points: sqftPoints, max: 15 });

  // Number of locations
  const locs = lead.estimated_locations ?? 0;
  let locPoints = 0;
  if (locs >= 10) locPoints = 15;
  else if (locs >= 5) locPoints = 10;
  else if (locs >= 2) locPoints = 5;
  inputs.push({ label: 'Multi-location', points: locPoints, max: 15 });

  // Title quality (decision-maker signals)
  const title = (lead.title ?? '').toLowerCase();
  let titlePoints = 0;
  if (/\b(facility|operations|property|building|janitorial|cleaning)\s*manager\b|director|vp|owner|ceo|cfo\b/i.test(title)) titlePoints = 15;
  else if (/\bmanager\b|supervisor|coordinator/i.test(title)) titlePoints = 8;
  else if (title.length > 0) titlePoints = 3;
  inputs.push({ label: 'Title', points: titlePoints, max: 15 });

  // Enrichment completeness
  const enrichment = lead.enrichment_status === 'enriched' || lead.enrichment_status === 'complete' ? 15 : 0;
  inputs.push({ label: 'Enrichment', points: enrichment, max: 15 });

  // Engagement (last contact / follow-up set)
  const hasEngagement = !!(lead.last_contact_at || lead.next_follow_up_at);
  inputs.push({ label: 'Engagement', points: hasEngagement ? 10 : 0, max: 10 });

  // Source bonus (referral, customer referral)
  const source = lead.source ?? '';
  let sourceBonus = 0;
  if (source === 'existing_customer_referral' || source === 'referral') sourceBonus = 10;
  else if (source === 'website_form') sourceBonus = 5;
  inputs.push({ label: 'Source', points: sourceBonus, max: 10 });

  return inputs;
}

/** Inputs that contribute to qualification_score (sales readiness) */
function qualificationScoreInputs(lead: Partial<LeadRecord>): { label: string; points: number; max: number }[] {
  const inputs: { label: string; points: number; max: number }[] = [];

  const decisionMaker = !!(lead.title?.trim() && (lead.title?.toLowerCase().includes('manager') || lead.title?.toLowerCase().includes('director') || lead.title?.toLowerCase().includes('owner') || lead.title?.toLowerCase().includes('vp')));
  inputs.push({ label: 'Decision maker', points: decisionMaker ? 20 : 0, max: 20 });

  const buildingConfirmed = !!(lead.address?.trim() || (lead.city?.trim() && lead.zip?.trim()));
  inputs.push({ label: 'Building confirmed', points: buildingConfirmed ? 15 : 0, max: 15 });

  const serviceNeed = lead.notes?.trim()?.length ? 10 : 0;
  inputs.push({ label: 'Service need', points: serviceNeed, max: 15 });

  const frequencyKnown = !!(lead.notes?.toLowerCase().includes('daily') || lead.notes?.toLowerCase().includes('weekly') || lead.notes?.toLowerCase().includes('nightly'));
  inputs.push({ label: 'Frequency known', points: frequencyKnown ? 10 : 0, max: 15 });

  const sqftKnown = (lead.estimated_sq_ft ?? 0) > 0;
  inputs.push({ label: 'Sq ft known', points: sqftKnown ? 15 : 0, max: 15 });

  const walkthroughInterest = ['qualified', 'walkthrough_scheduled', 'walkthrough_completed', 'proposal_stage'].includes(lead.status ?? '');
  inputs.push({ label: 'Walkthrough interest', points: walkthroughInterest ? 20 : 0, max: 20 });

  const timelineKnown = !!(lead.notes?.toLowerCase().includes('q1') || lead.notes?.toLowerCase().includes('quarter') || lead.notes?.toLowerCase().includes('asap') || lead.notes?.toLowerCase().includes('next month'));
  inputs.push({ label: 'Timeline', points: timelineKnown ? 10 : 0, max: 10 });

  return inputs;
}

/** Compute lead_score 0–100 from inputs */
export function computeLeadScore(lead: Partial<LeadRecord>): { score: number; inputs: { label: string; points: number; max: number }[] } {
  const inputs = leadScoreInputs(lead);
  const total = inputs.reduce((s, i) => s + i.points, 0);
  const maxTotal = inputs.reduce((s, i) => s + i.max, 0);
  const score = maxTotal > 0 ? Math.round((total / maxTotal) * MAX_LEAD_SCORE) : 0;
  return { score: Math.min(MAX_LEAD_SCORE, score), inputs };
}

/** Compute qualification_score 0–100 from inputs */
export function computeQualificationScore(lead: Partial<LeadRecord>): { score: number; inputs: { label: string; points: number; max: number }[] } {
  const inputs = qualificationScoreInputs(lead);
  const total = inputs.reduce((s, i) => s + i.points, 0);
  const maxTotal = inputs.reduce((s, i) => s + i.max, 0);
  const score = maxTotal > 0 ? Math.round((total / maxTotal) * MAX_QUALIFICATION_SCORE) : 0;
  return { score: Math.min(MAX_QUALIFICATION_SCORE, score), inputs };
}
