'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit-log';

/** Filters for accounts list */
export type AccountListFilters = {
  q?: string;
  status?: string;
  owner_id?: string;
  tag?: string;
  city?: string;
  zip?: string;
  last_activity_since?: string;
};

/** One row for the accounts table */
export type AccountRow = {
  id: string;
  name: string;
  status: string;
  industry: string | null;
  city: string | null;
  primary_contact_name: string | null;
  primary_contact_role: string | null;
  health: number;
  health_label: string;
  open_opps_count: number;
  open_opps_value: number;
  last_activity_text: string | null;
  next_step_text: string | null;
  owner_initials: string | null;
  created_at: string;
};

/** KPIs for the accounts page strip */
export type AccountListKpis = {
  accountsCount: number;
  openOppsCount: number;
  openOppsValue: number;
  followUpsDueCount: number;
  atRiskCount: number;
};

export type AccountListResult = {
  accounts: AccountRow[];
  kpis: AccountListKpis;
};

export type CrmOwner = { id: string; full_name: string | null };

export async function getCrmOwners(org_id: string): Promise<CrmOwner[]> {
  const supabase = await createClient();
  const { data: members } = await supabase.from('org_members').select('user_id').eq('org_id', org_id).eq('status', 'active');
  const userIds = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id).filter(Boolean))];
  if (!userIds.length) return [];
  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  return (profiles ?? []).map((p: { id: string; full_name?: string | null }) => ({ id: p.id, full_name: p.full_name ?? null }));
}

const OPEN_STAGES = ['qualification', 'proposal', 'negotiation', 'walkthrough', 'discovery', 'demo'];

export async function getAccountListData(
  org_id: string,
  filters?: AccountListFilters
): Promise<AccountListResult> {
  const supabase = await createClient();

  let q = supabase
    .from('clients')
    .select('id, name, status, industry, created_at, owner_user_id')
    .eq('org_id', org_id)
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    const statusMap: Record<string, string> = {
      active: 'active',
      prospect: 'lead',
      churned: 'former',
      paused: 'paused',
      'do-not-contact': 'former',
    };
    const dbStatus = statusMap[filters.status] ?? filters.status;
    q = q.eq('status', dbStatus);
  }
  if (filters?.owner_id) q = q.eq('owner_user_id', filters.owner_id);
  if (filters?.tag ?? filters?.industry) q = q.eq('industry', (filters?.tag ?? filters?.industry) ?? '');
  if (filters?.q?.trim()) q = q.ilike('name', `%${filters.q.trim()}%`);

  const { data: clients } = await q;
  if (!clients?.length) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const { count: followUpsDueCount0 } = await supabase.from('crm_activities').select('id', { count: 'exact', head: true }).eq('org_id', org_id).not('due_at', 'is', null).is('completed_at', null).gte('due_at', todayStart.toISOString()).lte('due_at', todayEnd.toISOString());
    return {
      accounts: [],
      kpis: {
        accountsCount: 0,
        openOppsCount: 0,
        openOppsValue: 0,
        followUpsDueCount: followUpsDueCount0 ?? 0,
        atRiskCount: 0,
      },
    };
  }

  const clientIds = clients.map((c) => c.id);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const [locationsRes, contactsRes, oppsRes, activitiesRes, dueTodayRes, profilesRes] = await Promise.all([
    supabase.from('locations').select('client_id, city').in('client_id', clientIds),
    supabase.from('crm_contacts').select('client_id, first_name, last_name, contact_type, is_primary').in('client_id', clientIds),
    supabase.from('opportunities').select('client_id, stage, est_mrr').eq('org_id', org_id).in('client_id', clientIds),
    supabase.from('crm_activities').select('client_id, type, subject, due_at, completed_at, created_at').eq('org_id', org_id).in('client_id', clientIds).order('created_at', { ascending: false }),
    supabase.from('crm_activities').select('id', { count: 'exact', head: true }).eq('org_id', org_id).not('due_at', 'is', null).is('completed_at', null).gte('due_at', todayStart.toISOString()).lte('due_at', todayEnd.toISOString()),
    clients.some((c) => (c as { owner_user_id?: string }).owner_user_id) ? supabase.from('profiles').select('id, full_name').in('id', clients.map((c) => (c as { owner_user_id?: string }).owner_user_id).filter(Boolean) as string[]) : Promise.resolve({ data: [] }),
  ]);

  const locsByClient = new Map<string, { city?: string | null; count: number }>();
  (locationsRes.data ?? []).forEach((loc: { client_id?: string; city?: string | null }) => {
    if (!loc.client_id) return;
    const cur = locsByClient.get(loc.client_id) ?? { count: 0 };
    if (!cur.city && loc.city) cur.city = loc.city;
    cur.count += 1;
    locsByClient.set(loc.client_id, cur);
  });

  const primaryByClient = new Map<string, { name: string; role: string }>();
  (contactsRes.data ?? []).forEach((c: { client_id: string; first_name?: string | null; last_name?: string | null; contact_type?: string | null; is_primary?: boolean }) => {
    if (c.is_primary || !primaryByClient.has(c.client_id)) {
      const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || '—';
      primaryByClient.set(c.client_id, { name, role: c.contact_type ?? '—' });
    }
  });

  const openOppsByClient = new Map<string, { count: number; value: number }>();
  (oppsRes.data ?? []).forEach((o: { client_id: string; stage: string; est_mrr?: number | null }) => {
    if (!OPEN_STAGES.includes(o.stage?.toLowerCase?.())) return;
    const cur = openOppsByClient.get(o.client_id) ?? { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(o.est_mrr) || 0;
    openOppsByClient.set(o.client_id, cur);
  });

  const lastActivityByClient = new Map<string, { text: string }>();
  const nextStepByClient = new Map<string, string>();
  (activitiesRes.data ?? []).forEach((a: { client_id: string; type: string; subject?: string | null; created_at: string; due_at?: string | null; completed_at?: string | null }) => {
    if (!lastActivityByClient.has(a.client_id)) {
      const typeLabel = a.type.charAt(0).toUpperCase() + a.type.slice(1);
      const created = new Date(a.created_at);
      const days = Math.floor((Date.now() - created.getTime()) / 86400000);
      const ago = days === 0 ? 'Today' : days === 1 ? '1d ago' : `${days}d ago`;
      lastActivityByClient.set(a.client_id, { text: `${typeLabel} · ${ago}` });
    }
    if (!a.completed_at && a.due_at && !nextStepByClient.has(a.client_id)) {
      const d = new Date(a.due_at);
      nextStepByClient.set(a.client_id, `${a.type} due ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`);
    }
  });

  const profiles = new Map((profilesRes.data ?? []).map((p: { id: string; full_name?: string | null }) => [p.id, (p.full_name ?? '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '—']));

  let totalOpenOpps = 0;
  let totalOpenValue = 0;
  openOppsByClient.forEach((v) => {
    totalOpenOpps += v.count;
    totalOpenValue += v.value;
  });

  const accounts: AccountRow[] = clients.map((c) => {
    const clientId = c.id;
    const loc = locsByClient.get(clientId);
    const primary = primaryByClient.get(clientId);
    const opps = openOppsByClient.get(clientId) ?? { count: 0, value: 0 };
    const lastAct = lastActivityByClient.get(clientId);
    const nextStep = nextStepByClient.get(clientId);
    const ownerId = (c as { owner_user_id?: string }).owner_user_id;
    const health = lastAct ? 80 : opps.count > 0 ? 60 : 40;
    const health_label = health >= 70 ? 'Healthy' : health >= 50 ? 'Watch' : 'At risk';
    return {
      id: clientId,
      name: c.name,
      status: c.status ?? 'lead',
      industry: c.industry ?? null,
      city: loc?.city ?? null,
      primary_contact_name: primary?.name ?? null,
      primary_contact_role: primary?.role ?? null,
      health,
      health_label,
      open_opps_count: opps.count,
      open_opps_value: opps.value,
      last_activity_text: lastAct?.text ?? null,
      next_step_text: nextStep ?? null,
      owner_initials: ownerId ? profiles.get(ownerId) ?? null : null,
      created_at: c.created_at,
    };
  });

  const atRiskCount = accounts.filter((a) => a.health < 50).length;
  const followUpsDueCount = (dueTodayRes as { count?: number })?.count ?? 0;

  return {
    accounts,
    kpis: {
      accountsCount: accounts.length,
      openOppsCount: totalOpenOpps,
      openOppsValue: totalOpenValue,
      followUpsDueCount,
      atRiskCount,
    },
  };
}

export type ClientDetail = {
  client: { id: string; name: string; status?: string; industry?: string; website?: string; phone?: string; billing_json?: unknown; created_at: string } | null;
  locations: { id: string; name: string; address?: string | null; city?: string | null; state?: string | null; zip?: string | null }[];
  contacts: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; contact_type?: string | null; is_primary?: boolean }[];
  opportunities: { id: string; stage: string; est_mrr?: number | null; created_at: string }[];
  recentActivities: { id: string; type: string; subject?: string | null; due_at?: string | null; completed_at?: string | null; created_at: string }[];
};

export async function getClientDetail(org_id: string, client_id: string): Promise<ClientDetail> {
  const supabase = await createClient();

  const clientRes = await supabase.from('clients').select('id, name, status, industry, website, phone, billing_json, created_at').eq('id', client_id).eq('org_id', org_id).single();
  const locationsRes = await supabase.from('locations').select('id, name, address, city, state, zip').eq('client_id', client_id).eq('org_id', org_id).order('name');
  const contactsRes = await supabase.from('crm_contacts').select('id, first_name, last_name, email, phone, contact_type, is_primary').eq('client_id', client_id).eq('org_id', org_id);
  const opportunitiesRes = await supabase.from('opportunities').select('id, stage, est_mrr, created_at').eq('client_id', client_id).eq('org_id', org_id).order('created_at', { ascending: false }).limit(20);
  const activitiesRes = await supabase.from('crm_activities').select('id, type, subject, due_at, completed_at, created_at').eq('client_id', client_id).eq('org_id', org_id).order('created_at', { ascending: false }).limit(20);

  return {
    client: clientRes.data ?? null,
    locations: locationsRes.data ?? [],
    contacts: contactsRes.data ?? [],
    opportunities: opportunitiesRes.data ?? [],
    recentActivities: activitiesRes.data ?? [],
  };
}

export type OpportunityDetail = {
  opportunity: { id: string; stage: string; est_mrr?: number | null; est_value?: number | null; owner_id?: string | null; created_at: string } | null;
  client: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
  location: { id: string; name: string; address?: string | null; city?: string | null } | null;
  bids: { id: string; status: string; total_estimated_cost?: number | null; created_at: string }[];
  walkthroughs: { id: string; status: string; scheduled_at?: string | null }[];
  activities: { id: string; type: string; subject?: string | null; due_at?: string | null; completed_at?: string | null; created_at: string }[];
};

export async function getOpportunityDetail(org_id: string, opportunity_id: string): Promise<OpportunityDetail> {
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, stage, est_mrr, est_value, owner_id, client_id, account_id, location_id, site_id, created_at')
    .eq('id', opportunity_id)
    .eq('org_id', org_id)
    .single();

  if (!opportunity) {
    return { opportunity: null, client: null, account: null, location: null, bids: [], walkthroughs: [], activities: [] };
  }

  const clientRes = opportunity.client_id
    ? await supabase.from('clients').select('id, name').eq('id', opportunity.client_id).eq('org_id', org_id).single()
    : { data: null };
  const accountId = (opportunity as { account_id?: string | null }).account_id;
  const accountRes = accountId
    ? await supabase.from('accounts').select('id, name').eq('id', accountId).eq('org_id', org_id).single()
    : { data: null };
  // Canonical: use location_id and locations. Legacy fallback: if only site_id set, fetch site for display only (no new sites created).
  let locationRes: { data: { id: string; name: string; address?: string | null; city?: string | null } | null };
  if (opportunity.location_id) {
    locationRes = await supabase.from('locations').select('id, name, address, city').eq('id', opportunity.location_id).eq('org_id', org_id).single().catch(() => ({ data: null }));
  } else if ((opportunity as { site_id?: string | null }).site_id) {
    const siteId = (opportunity as { site_id: string }).site_id;
    locationRes = await supabase.from('sites').select('id, name, address, city').eq('id', siteId).eq('org_id', org_id).single().catch(() => ({ data: null }));
  } else {
    locationRes = { data: null };
  }
  const bidsRes = await supabase.from('bids').select('id, status, total_estimated_cost, created_at').eq('opportunity_id', opportunity_id).eq('org_id', org_id).order('created_at', { ascending: false }).catch(() => ({ data: [] }));
  const walkthroughsRes = await supabase.from('walkthroughs').select('id, status, scheduled_at').eq('opportunity_id', opportunity_id).eq('org_id', org_id).order('scheduled_at', { ascending: false });
  const activitiesRes = await supabase.from('crm_activities').select('id, type, subject, due_at, completed_at, created_at').eq('opportunity_id', opportunity_id).eq('org_id', org_id).order('created_at', { ascending: false }).catch(() => ({ data: [] }));

  return {
    opportunity: { id: opportunity.id, stage: opportunity.stage, est_mrr: opportunity.est_mrr, est_value: opportunity.est_value, owner_id: opportunity.owner_id, created_at: opportunity.created_at },
    client: clientRes.data ?? null,
    account: accountRes.data ?? null,
    location: locationRes.data ?? null,
    bids: Array.isArray(bidsRes.data) ? bidsRes.data : [],
    walkthroughs: walkthroughsRes.data ?? [],
    activities: Array.isArray(activitiesRes.data) ? activitiesRes.data : [],
  };
}

const ACTIVITY_TYPES = ['call', 'email', 'sms', 'meeting', 'task', 'note'] as const;

export async function createActivity(payload: {
  org_id: string;
  type: (typeof ACTIVITY_TYPES)[number];
  subject?: string | null;
  body?: string | null;
  due_at?: string | null;
  client_id?: string | null;
  location_id?: string | null;
  opportunity_id?: string | null;
  assigned_to?: string | null;
}): Promise<{ id?: string; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Use server-derived org only (tenant isolation: ignore client-supplied org_id)
  const org_id = org.org_id;

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      org_id,
      type: payload.type,
      subject: payload.subject ?? null,
      body: payload.body ?? null,
      due_at: payload.due_at ?? null,
      client_id: payload.client_id ?? null,
      location_id: payload.location_id ?? null,
      opportunity_id: payload.opportunity_id ?? null,
      created_by: user?.id ?? null,
      assigned_to: payload.assigned_to ?? null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  return { id: data.id };
}

export async function completeActivity(activity_id: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from('crm_activities')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', activity_id)
    .eq('org_id', org.org_id);

  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  return {};
}

/**
 * Mark deal as won (Sales-only flow). Updates opportunity + linked proposals; no ops account/launch.
 * Use for Cub plan. Grizzly/Kodiak can use this too or use Launch to Operations.
 */
export async function markDealWon(opportunityId: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: opp } = await supabase
    .from('opportunities')
    .select('id, stage')
    .eq('id', opportunityId)
    .eq('org_id', org.org_id)
    .single();

  if (!opp) return { error: 'Opportunity not found' };
  if (opp.stage === 'won') return {}; // idempotent

  const now = new Date().toISOString();

  const { error: oppError } = await supabase
    .from('opportunities')
    .update({
      stage: 'won',
      closed_at: now,
      won_at: now,
      updated_at: now,
    })
    .eq('id', opportunityId)
    .eq('org_id', org.org_id);

  if (oppError) return { error: oppError.message };

  await supabase
    .from('proposals')
    .update({ status: 'accepted', updated_at: now })
    .eq('opportunity_id', opportunityId)
    .eq('org_id', org.org_id);

  try {
    await logAudit({
      orgId: org.org_id,
      action: 'deal_won',
      entityType: 'opportunity',
      entityId: opportunityId,
      beforeState: { stage: opp.stage },
      afterState: { stage: 'won' },
    });
  } catch {
    // non-fatal
  }

  revalidatePath('/app/crm');
  revalidatePath('/app/crm/opportunities/' + opportunityId);
  revalidatePath('/app/sales/pipeline');
  revalidatePath('/app/sales/win-loss');
  revalidatePath('/app/sales/proposals');
  return {};
}
