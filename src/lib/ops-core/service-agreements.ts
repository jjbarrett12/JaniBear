/**
 * Service agreements and lines — create from launch packet or manually.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ServiceAgreementRow, ServiceLineRow } from './types';
import type { ServiceLineTypeCode } from './types';

export interface CreateAgreementInput {
  orgId: string;
  accountId: string;
  facilityId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  contractRef?: string | null;
  contractValueMonthly?: number | null;
  serviceFrequency?: string | null;
  serviceDays?: string[] | null;
  /** Human-readable scope summary for ops/scheduling. */
  generalScopeSummary?: string | null;
  notes?: string | null;
  sourceOpportunityId?: string | null;
  sourceProposalId?: string | null;
  lineTypes?: ServiceLineTypeCode[];
}

/**
 * Create a service agreement and optionally service lines. Returns agreement id and line ids.
 */
export async function createServiceAgreement(input: CreateAgreementInput): Promise<{
  agreementId: string;
  lineIds: string[];
}> {
  const supabase = await createClient();
  const { data: agreement, error: aggErr } = await supabase
    .from('service_agreements')
    .insert({
      org_id: input.orgId,
      account_id: input.accountId,
      facility_id: input.facilityId,
      name: input.name,
      status: 'active',
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      contract_ref: input.contractRef ?? null,
      contract_value_monthly: input.contractValueMonthly ?? null,
      service_frequency: input.serviceFrequency ?? null,
      service_days: input.serviceDays ?? [],
      general_scope_summary: input.generalScopeSummary ?? null,
      notes: input.notes ?? null,
      source_opportunity_id: input.sourceOpportunityId ?? null,
      source_proposal_id: input.sourceProposalId ?? null,
    })
    .select('id')
    .single();
  if (aggErr || !agreement) throw new Error(aggErr?.message ?? 'Failed to create service agreement');

  const lineIds: string[] = [];
  const types = input.lineTypes ?? ['nightly_janitorial'];
  const lineNames: Record<ServiceLineTypeCode, string> = {
    nightly_janitorial: 'Nightly Janitorial',
    floor_care: 'Floor Care',
    porter: 'Porter',
    windows: 'Windows',
    trash: 'Trash',
    restroom_reset: 'Restroom Reset',
  };
  for (let i = 0; i < types.length; i++) {
    const { data: line, error: lineErr } = await supabase
      .from('service_lines')
      .insert({
        org_id: input.orgId,
        service_agreement_id: agreement.id,
        line_type: types[i],
        name: lineNames[types[i]] ?? types[i],
        sort_order: i,
      })
      .select('id')
      .single();
    if (lineErr || !line) throw new Error(lineErr?.message ?? `Failed to create service line ${types[i]}`);
    lineIds.push(line.id);
  }
  return { agreementId: agreement.id, lineIds };
}

/**
 * Get agreement by id with lines.
 */
export async function getAgreementWithLines(
  orgId: string,
  agreementId: string
): Promise<{ agreement: ServiceAgreementRow; lines: ServiceLineRow[] } | null> {
  const supabase = await createClient();
  const { data: agreement, error: e1 } = await supabase
    .from('service_agreements')
    .select('*')
    .eq('id', agreementId)
    .eq('org_id', orgId)
    .single();
  if (e1 || !agreement) return null;
  const { data: lines } = await supabase
    .from('service_lines')
    .select('*')
    .eq('service_agreement_id', agreementId)
    .eq('org_id', orgId)
    .order('sort_order');
  return {
    agreement: agreement as ServiceAgreementRow,
    lines: (lines ?? []) as ServiceLineRow[],
  };
}
