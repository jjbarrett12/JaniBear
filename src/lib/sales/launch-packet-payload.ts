/**
 * Launch packet payload shape — ops handoff from sales.
 * Stored in launch_packets.payload_jsonb.
 */
export interface LaunchPacketPayload {
  /** Customer/account info for ops */
  customer_info?: {
    account_name?: string;
    billing_contact_name?: string;
    billing_email?: string;
    billing_phone?: string;
    primary_contact_name?: string;
    primary_contact_email?: string;
    primary_contact_phone?: string;
  };
  /** Service locations (buildings/sites) to activate */
  service_locations?: Array<{
    name?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    timezone?: string;
    access_notes?: string;
    service_notes?: string;
  }>;
  /** Sold services (e.g. nightly janitorial, floor care) */
  sold_services?: string[];
  /** Service frequency (e.g. 5x/week, nightly) */
  service_frequency?: string;
  /** Service days if applicable */
  service_days?: string[];
  /** Scope summary for ops; flows into service_agreement.general_scope_summary when created from launch. */
  scope_summary?: string;
  /** Special instructions or notes */
  special_notes?: string;
  /** Staffing assumptions (crew size, supervisor, etc.) */
  staffing_assumptions?: string;
  /** Supplies/equipment notes */
  supplies_equipment_notes?: string;
  /** Inspection setup requirements */
  inspection_setup_requirements?: string;
  /** Launch status (draft, ready, etc.) — can mirror packet status */
  launch_status?: string;
  /** Optional contract/proposal ref */
  contract_ref?: string;
  /** Optional estimated start date */
  estimated_start_date?: string;
}

/** Build payload from lead + account for conversion-created packet */
export function buildLaunchPayloadFromLead(params: {
  lead: {
    company?: string | null;
    contact_name?: string | null;
    contact_first_name?: string | null;
    contact_last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    address?: string | null;
    address_line_1?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    postal_code?: string | null;
    service_frequency_guess?: string | null;
    est_monthly_cleaning_value?: number | null;
    building_type?: string | null;
    notes?: string | null;
  };
  account?: { name?: string; billing_contact_name?: string | null; billing_email?: string | null; billing_phone?: string | null } | null;
  overrides?: Partial<LaunchPacketPayload>;
}): LaunchPacketPayload {
  const { lead, account, overrides = {} } = params;
  const primaryName = lead.contact_name?.trim() || [lead.contact_first_name, lead.contact_last_name].filter(Boolean).join(' ').trim() || undefined;
  const payload: LaunchPacketPayload = {
    customer_info: {
      account_name: account?.name ?? lead.company?.trim() ?? undefined,
      billing_contact_name: account?.billing_contact_name ?? primaryName ?? undefined,
      billing_email: account?.billing_email ?? lead.email?.trim() ?? lead.alternate_email ?? undefined,
      billing_phone: account?.billing_phone ?? lead.phone?.trim() ?? lead.mobile ?? undefined,
      primary_contact_name: primaryName,
      primary_contact_email: lead.email?.trim() ?? undefined,
      primary_contact_phone: lead.phone?.trim() ?? lead.mobile ?? undefined,
    },
    service_locations: [
      {
        name: lead.company?.trim() || primaryName || 'Primary',
        address_line_1: lead.address_line_1?.trim() || lead.address?.trim() || undefined,
        city: lead.city?.trim() ?? undefined,
        state: lead.state?.trim() ?? undefined,
        zip: (lead.postal_code || lead.zip)?.trim() ?? undefined,
        service_notes: lead.notes?.trim() ?? undefined,
      },
    ].filter((loc) => loc.name || loc.address_line_1),
    sold_services: lead.building_type ? [lead.building_type] : ['Nightly Janitorial'],
    service_frequency: lead.service_frequency_guess?.trim() ?? undefined,
    scope_summary: overrides.scope_summary,
    special_notes: lead.notes?.trim() ?? undefined,
    launch_status: 'draft',
    ...overrides,
  };
  return payload;
}
