/**
 * Account Intelligence Profile — service layer.
 * Ensure profile for lead, merge from lead/walkthrough/proposal, update readiness.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import * as repo from './profile-repository';
import type { AccountIntelligenceProfile, VerificationState } from '@/types/account-intelligence-profile';

/** Ensure a profile exists for this lead; create and seed from lead if missing. */
export async function ensureProfileForLead(orgId: string, leadId: string): Promise<AccountIntelligenceProfile> {
  const profile = await repo.ensureForLead(orgId, leadId);
  return profile;
}

/** Seed profile from lead record (building_type, service_frequency_guess, industry, etc.). Call after ensure. */
export async function mergeFromLead(
  orgId: string,
  profileId: string,
  lead: {
    building_type?: string | null;
    service_frequency_guess?: string | null;
    address_line_1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    postal_code?: string | null;
    est_monthly_cleaning_value?: number | null;
    company?: string | null;
    notes?: string | null;
    industry?: string | null;
    occupancy_pattern?: string | null;
  }
): Promise<AccountIntelligenceProfile | null> {
  const updates: Parameters<typeof repo.update>[2] = {
    building_type: lead.building_type ?? undefined,
    service_frequency: lead.service_frequency_guess ?? undefined,
    industry: lead.industry ?? undefined,
    occupancy_pattern: lead.occupancy_pattern ?? undefined,
    evidence_summary: {
      lead: {
        address: [lead.address_line_1, lead.city, lead.state, lead.zip ?? lead.postal_code].filter(Boolean).join(', ') || undefined,
        est_monthly_cleaning_value: lead.est_monthly_cleaning_value ?? undefined,
        company: lead.company ?? undefined,
        notes: lead.notes ?? undefined,
      },
    },
  };
  return repo.update(orgId, profileId, updates);
}

/** Merge data from walkthrough into profile (scope, sqft, rooms). Stub: extend when walkthrough schema is fixed. */
export async function mergeFromWalkthrough(
  orgId: string,
  profileId: string,
  _walkthrough: { id: string; square_footage_estimate?: number | null; [key: string]: unknown }
): Promise<AccountIntelligenceProfile | null> {
  const updates: Parameters<typeof repo.update>[2] = {
    square_footage_estimate: _walkthrough.square_footage_estimate ?? undefined,
    evidence_summary: { walkthrough_id: _walkthrough.id },
  };
  return repo.update(orgId, profileId, updates);
}

/** Merge from proposal (readiness). Stub. */
export async function mergeFromProposal(
  orgId: string,
  profileId: string,
  _proposal: { id: string; [key: string]: unknown }
): Promise<AccountIntelligenceProfile | null> {
  return repo.update(orgId, profileId, {
    proposal_readiness: 'generated',
    evidence_summary: { proposal_id: _proposal.id },
  });
}

/** Update proposal or activation readiness. */
export async function updateReadiness(
  orgId: string,
  profileId: string,
  updates: { proposal_readiness?: string | null; activation_readiness?: string | null }
): Promise<AccountIntelligenceProfile | null> {
  return repo.update(orgId, profileId, updates);
}

/** Set account_id on profile (e.g. when lead converts). */
export async function linkAccountToProfile(
  orgId: string,
  profileId: string,
  accountId: string,
  opportunityId?: string | null
): Promise<AccountIntelligenceProfile | null> {
  return repo.update(orgId, profileId, {
    account_id: accountId,
    opportunity_id: opportunityId ?? undefined,
  });
}

/** Get profile for lead, or for account if lead converted. */
export async function getProfileForLeadOrAccount(
  orgId: string,
  leadId: string | null,
  accountId: string | null
): Promise<AccountIntelligenceProfile | null> {
  if (accountId) {
    const byAccount = await repo.getByAccountId(orgId, accountId);
    if (byAccount) return byAccount;
  }
  if (leadId) return repo.getByLeadId(orgId, leadId);
  return null;
}

/** Merge LiDAR-derived data into profile (sqft, floor_count, complexity_tier, spaces). Call from LiDAR job. */
export async function mergeFromLidar(
  orgId: string,
  profileId: string,
  data: {
    square_footage_estimate?: number | null;
    floor_count?: number | null;
    complexity_tier?: string | null;
    flooring_mix?: Record<string, unknown> | null;
    restroom_count?: number | null;
    kitchen_breakroom_count?: number | null;
    extracted_data?: Record<string, unknown> | null;
  }
): Promise<AccountIntelligenceProfile | null> {
  const updates: Parameters<typeof repo.update>[2] = {
    square_footage_estimate: data.square_footage_estimate ?? undefined,
    floor_count: data.floor_count ?? undefined,
    complexity_tier: data.complexity_tier ?? undefined,
    flooring_mix: data.flooring_mix ?? undefined,
    restroom_count: data.restroom_count ?? undefined,
    kitchen_breakroom_count: data.kitchen_breakroom_count ?? undefined,
    extracted_data: data.extracted_data ?? undefined,
  };
  return repo.update(orgId, profileId, updates);
}

/** Merge voice/transcription data into profile (extracted_data, scope, flooring). Call from transcription job. */
export async function mergeFromVoiceNote(
  orgId: string,
  profileId: string,
  data: {
    cleaning_scope_summary?: string | null;
    special_cleaning_requirements?: string | null;
    frequency_recommendation?: string | null;
    flooring_mix?: Record<string, unknown> | null;
    extracted_data?: Record<string, unknown> | null;
  }
): Promise<AccountIntelligenceProfile | null> {
  const updates: Parameters<typeof repo.update>[2] = {
    cleaning_scope_summary: data.cleaning_scope_summary ?? undefined,
    special_cleaning_requirements: data.special_cleaning_requirements ?? undefined,
    frequency_recommendation: data.frequency_recommendation ?? undefined,
    flooring_mix: data.flooring_mix ?? undefined,
    extracted_data: data.extracted_data ?? undefined,
  };
  return repo.update(orgId, profileId, updates);
}
