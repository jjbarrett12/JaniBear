/**
 * Account Intelligence Profile — event-driven update triggers.
 * Call these from application code when events occur (lead created, walkthrough completed, etc.).
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import * as repo from './profile-repository';
import * as svc from './profile-service';
import type { ProfileEventType, ProfileSourceEntityType } from '@/types/account-intelligence-profile';

/** Lead created: ensure profile for lead, attach source, optionally seed from lead. */
export async function onLeadCreated(orgId: string, leadId: string): Promise<void> {
  const profile = await svc.ensureProfileForLead(orgId, leadId);
  await repo.attachSource({
    orgId,
    profileId: profile.id,
    sourceType: 'lead_created',
    sourceEntityType: 'lead',
    sourceEntityId: leadId,
  });
  const supabase = await createClient();
  const { data: lead } = await supabase.from('leads').select('building_type, service_frequency_guess, address_line_1, city, state, zip, postal_code, est_monthly_cleaning_value, company, notes').eq('id', leadId).eq('org_id', orgId).single();
  if (lead) await svc.mergeFromLead(orgId, profile.id, lead as Record<string, unknown>);
}

/** Walkthrough scheduled: attach source. */
export async function onWalkthroughScheduled(
  orgId: string,
  profileId: string,
  walkthroughId: string
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'walkthrough_scheduled',
    sourceEntityType: 'walkthrough',
    sourceEntityId: walkthroughId,
  });
}

/** LiDAR uploaded: attach source; merge can be done by a separate job that reads scan. */
export async function onLidarUploaded(
  orgId: string,
  profileId: string,
  sourceEntityId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'lidar_uploaded',
    sourceEntityType: 'walkthrough',
    sourceEntityId,
    meta,
  });
}

/** Walkthrough completed: attach source, merge walkthrough data. */
export async function onWalkthroughCompleted(
  orgId: string,
  profileId: string,
  walkthroughId: string,
  walkthrough?: { square_footage_estimate?: number | null; [key: string]: unknown }
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'walkthrough_completed',
    sourceEntityType: 'walkthrough',
    sourceEntityId: walkthroughId,
  });
  if (walkthrough) await svc.mergeFromWalkthrough(orgId, profileId, { id: walkthroughId, ...walkthrough });
}

/** Proposal generated: attach source, merge. */
export async function onProposalGenerated(
  orgId: string,
  profileId: string,
  proposalId: string,
  proposal?: { id: string; [key: string]: unknown }
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'proposal_generated',
    sourceEntityType: 'proposal',
    sourceEntityId: proposalId,
  });
  if (proposal) await svc.mergeFromProposal(orgId, profileId, proposal);
}

/** Deal closed won: link account to profile if not already, attach source. */
export async function onDealClosedWon(
  orgId: string,
  profileId: string,
  accountId: string,
  opportunityId?: string | null
): Promise<void> {
  await svc.linkAccountToProfile(orgId, profileId, accountId, opportunityId);
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'deal_closed_won',
    sourceEntityType: 'account',
    sourceEntityId: accountId,
    meta: opportunityId ? { opportunity_id: opportunityId } : undefined,
  });
}

/** Launch to Ops requested: update activation readiness, attach source. */
export async function onLaunchToOpsRequested(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'account'
): Promise<void> {
  await svc.updateReadiness(orgId, profileId, { activation_readiness: 'launch_requested' });
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'launch_to_ops_requested',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
  });
}

/** Ops activation started: attach source, update readiness. */
export async function onOpsActivationStarted(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'account'
): Promise<void> {
  await svc.updateReadiness(orgId, profileId, { activation_readiness: 'in_progress' });
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'ops_activation_started',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
  });
}

/** Account activated: attach source, update readiness. */
export async function onAccountActivated(
  orgId: string,
  profileId: string,
  accountId: string
): Promise<void> {
  await svc.updateReadiness(orgId, profileId, { activation_readiness: 'activated' });
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'account_activated',
    sourceEntityType: 'account',
    sourceEntityId: accountId,
  });
}

/** Lead enriched: attach source; merge can be done by enrichment job. */
export async function onLeadEnriched(
  orgId: string,
  profileId: string,
  leadId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'lead_enriched',
    sourceEntityType: 'lead',
    sourceEntityId: leadId,
    meta,
  });
}

/** Photos uploaded: attach source; optional AI merge later. */
export async function onPhotosUploaded(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'walkthrough',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'photos_uploaded',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Voice note uploaded: attach source; transcription can merge into extracted_data. */
export async function onVoiceNoteUploaded(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'walkthrough',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'voice_note_uploaded',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Proposal sent: attach source. */
export async function onProposalSent(
  orgId: string,
  profileId: string,
  proposalId: string
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'proposal_sent',
    sourceEntityType: 'proposal',
    sourceEntityId: proposalId,
  });
}

/** Contract uploaded: attach source; service can set verification_state to contract_confirmed. */
export async function onContractUploaded(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'contract',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'contract_uploaded',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Inspection failed: attach source; can append risk_flags and create risk recommendation. */
export async function onInspectionFailed(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'account',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'inspection_failed',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Complaint received: attach source; can append risk_flags and create risk recommendation. */
export async function onComplaintReceived(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'account',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'complaint_received',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Crew changed: attach source; assignment engine can recalc recommendations. */
export async function onCrewChanged(
  orgId: string,
  profileId: string,
  entityId: string,
  entityType: ProfileSourceEntityType = 'account',
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: 'crew_changed',
    sourceEntityType: entityType,
    sourceEntityId: entityId,
    meta,
  });
}

/** Generic: attach a source for any event type (for events not yet implemented). */
export async function attachEventSource(
  orgId: string,
  profileId: string,
  eventType: ProfileEventType,
  sourceEntityType: ProfileSourceEntityType,
  sourceEntityId: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await repo.attachSource({
    orgId,
    profileId,
    sourceType: eventType,
    sourceEntityType,
    sourceEntityId,
    meta,
  });
}
