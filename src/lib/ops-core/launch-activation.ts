/**
 * Launch packet → ops activation: create service agreement, lines, and initial assignments from packet.
 * Call when ops accepts a launch packet (status → accepted).
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createServiceAgreement } from './service-agreements';
import type { ServiceLineTypeCode } from './types';

export interface LaunchActivationPayload {
  facilityId: string;
  accountId: string;
  agreementName: string;
  startDate: string;
  endDate?: string | null;
  contractRef?: string | null;
  contractValueMonthly?: number | null;
  serviceFrequency?: string | null;
  serviceDays?: string[] | null;
  /** Scope summary for ops; from launch packet payload (proposal/walkthrough). */
  generalScopeSummary?: string | null;
  /** Opportunity this agreement is created from (for audit and linking). */
  sourceOpportunityId?: string | null;
  /** Proposal (and PDF) this agreement is created from; contract artifact unchanged. */
  sourceProposalId?: string | null;
  lineTypes?: ServiceLineTypeCode[];
  /** Initial crew id per service line (key = line_type or 'default'); used to create first assignment. */
  initialCrewId?: string | null;
}

/**
 * Create service agreement + lines + one assignment per facility (or per line if payload specifies).
 * Links launch_packet to the new agreement via service_agreement_id.
 */
export async function activateLaunchPacket(params: {
  orgId: string;
  launchPacketId: string;
  payload: LaunchActivationPayload;
  createdBy: string;
}): Promise<{ agreementId: string; assignmentIds: string[] }> {
  const supabase = await createClient();
  const { data: packet } = await supabase
    .from('launch_packets')
    .select('id, org_id, account_id')
    .eq('id', params.launchPacketId)
    .eq('org_id', params.orgId)
    .single();
  if (!packet) throw new Error('Launch packet not found');

  const accountId = params.payload.accountId ?? packet.account_id;
  const { agreementId, lineIds } = await createServiceAgreement({
    orgId: params.orgId,
    accountId,
    facilityId: params.payload.facilityId,
    name: params.payload.agreementName,
    startDate: params.payload.startDate,
    endDate: params.payload.endDate,
    contractRef: params.payload.contractRef,
    contractValueMonthly: params.payload.contractValueMonthly,
    serviceFrequency: params.payload.serviceFrequency,
    serviceDays: params.payload.serviceDays,
    generalScopeSummary: params.payload.generalScopeSummary,
    sourceOpportunityId: params.payload.sourceOpportunityId,
    sourceProposalId: params.payload.sourceProposalId,
    lineTypes: params.payload.lineTypes,
  });

  const assignmentIds: string[] = [];
  if (params.payload.initialCrewId) {
    const { data: lines } = await supabase
      .from('service_lines')
      .select('id')
      .eq('service_agreement_id', agreementId)
      .order('sort_order');
    const firstLineId = (lines ?? [])[0]?.id ?? null;
    const { data: assign } = await supabase
      .from('service_assignments')
      .insert({
        org_id: params.orgId,
        facility_id: params.payload.facilityId,
        service_line_id: firstLineId,
        crew_id: params.payload.initialCrewId,
        effective_from: params.payload.startDate,
        created_by: params.createdBy,
      })
      .select('id')
      .single();
    if (assign) assignmentIds.push(assign.id);
  }

  await supabase
    .from('launch_packets')
    .update({
      service_agreement_id: agreementId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.launchPacketId)
    .eq('org_id', params.orgId);

  return { agreementId, assignmentIds };
}
