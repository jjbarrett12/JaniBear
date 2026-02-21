'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type ClientDetail = {
  client: { id: string; name: string; status?: string; industry?: string; website?: string; phone?: string; billing_json?: unknown; created_at: string } | null;
  locations: { id: string; name: string; address?: string | null; city?: string | null; state?: string | null; zip?: string | null }[];
  contacts: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; contact_type?: string | null }[];
  opportunities: { id: string; stage: string; est_mrr?: number | null; created_at: string }[];
  recentActivities: { id: string; type: string; subject?: string | null; due_at?: string | null; completed_at?: string | null; created_at: string }[];
};

export async function getClientDetail(org_id: string, client_id: string): Promise<ClientDetail> {
  const supabase = await createClient();

  const clientRes = await supabase.from('clients').select('id, name, status, industry, website, phone, billing_json, created_at').eq('id', client_id).eq('org_id', org_id).single();
  const locationsRes = await supabase.from('locations').select('id, name, address, city, state, zip').eq('client_id', client_id).eq('org_id', org_id).order('name');
  const contactsRes = await supabase.from('crm_contacts').select('id, first_name, last_name, email, phone, contact_type').eq('client_id', client_id).eq('org_id', org_id);
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
  location: { id: string; name: string; address?: string | null; city?: string | null } | null;
  bids: { id: string; status: string; total_estimated_cost?: number | null; created_at: string }[];
  walkthroughs: { id: string; status: string; scheduled_at?: string | null }[];
  activities: { id: string; type: string; subject?: string | null; due_at?: string | null; completed_at?: string | null; created_at: string }[];
};

export async function getOpportunityDetail(org_id: string, opportunity_id: string): Promise<OpportunityDetail> {
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, stage, est_mrr, est_value, owner_id, client_id, location_id, site_id, created_at')
    .eq('id', opportunity_id)
    .eq('org_id', org_id)
    .single();

  if (!opportunity) {
    return { opportunity: null, client: null, location: null, bids: [], walkthroughs: [], activities: [] };
  }

  const clientRes = opportunity.client_id
    ? await supabase.from('clients').select('id, name').eq('id', opportunity.client_id).eq('org_id', org_id).single()
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
  await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('crm_activities')
    .insert({
      org_id: payload.org_id,
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
  await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from('crm_activities')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', activity_id);

  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  return {};
}
