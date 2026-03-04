'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const ALERT_TYPES = ['account_health_decay', 'missed_inspection', 'ar_aging', 'margin_leakage'] as const;
const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const STATUSES = ['open', 'assigned', 'dismissed'] as const;

export type AlertType = (typeof ALERT_TYPES)[number];
export type AlertSeverity = (typeof SEVERITIES)[number];
export type AlertStatus = (typeof STATUSES)[number];

export type AlertSignal = { label: string; value: string; detail?: string };

export type AlertRow = {
  id: string;
  org_id: string;
  type: AlertType;
  severity: AlertSeverity;
  entity_type: string;
  entity_id: string | null;
  title: string;
  body: string | null;
  status: AlertStatus;
  assigned_to: string | null;
  dismissed_at: string | null;
  signals: AlertSignal[];
  created_at: string;
  updated_at: string;
};

function toAlertRow(r: Record<string, unknown>): AlertRow {
  const signals = (r.signals as AlertSignal[] | null) ?? [];
  return {
    id: r.id as string,
    org_id: r.org_id as string,
    type: r.type as AlertType,
    severity: r.severity as AlertSeverity,
    entity_type: r.entity_type as string,
    entity_id: (r.entity_id as string) ?? null,
    title: r.title as string,
    body: (r.body as string) ?? null,
    status: r.status as AlertStatus,
    assigned_to: (r.assigned_to as string) ?? null,
    dismissed_at: (r.dismissed_at as string) ?? null,
    signals: Array.isArray(signals) ? signals : [],
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

export async function listAlerts(
  orgId: string,
  filters?: { status?: AlertStatus; type?: AlertType; severity?: AlertSeverity }
): Promise<{ alerts: AlertRow[]; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { alerts: [], error: 'Forbidden' };
  } catch {
    return { alerts: [], error: 'Unauthorized' };
  }

  const supabase = await createClient();
  let q = supabase
    .from('alerts')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.type) q = q.eq('type', filters.type);
  if (filters?.severity) q = q.eq('severity', filters.severity);

  const { data, error } = await q;

  if (error) return { alerts: [], error: error.message };
  return { alerts: (data ?? []).map(toAlertRow) };
}

export async function getAlertById(orgId: string, alertId: string): Promise<{ alert: AlertRow | null; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { alert: null, error: 'Forbidden' };
  } catch {
    return { alert: null, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (error) return { alert: null, error: error.message };
  return { alert: data ? toAlertRow(data) : null };
}

export async function dismissAlert(orgId: string, alertId: string): Promise<{ error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { error: 'Forbidden' };
  } catch {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('alerts')
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('org_id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/app/alerts');
  revalidatePath('/app/dashboard');
  return {};
}

/** List org members for assign dropdown (id, name). */
export async function listOrgMembersForAssign(orgId: string): Promise<{ members: Array<{ userId: string; name: string }>; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { members: [], error: 'Forbidden' };
  } catch {
    return { members: [], error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('org_members')
    .select('user_id, profiles(full_name)')
    .eq('org_id', orgId);

  if (error) return { members: [], error: error.message };
  const members = (data ?? []).map((m: { user_id: string; profiles: { full_name: string | null } | null }) => ({
    userId: m.user_id,
    name: (m.profiles as { full_name?: string | null })?.full_name ?? m.user_id.slice(0, 8),
  }));
  return { members };
}

export async function assignAlert(orgId: string, alertId: string, userId: string | null): Promise<{ error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { error: 'Forbidden' };
  } catch {
    return { error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('alerts')
    .update({
      status: userId ? 'assigned' : 'open',
      assigned_to: userId,
    })
    .eq('id', alertId)
    .eq('org_id', orgId);

  if (error) return { error: error.message };
  revalidatePath('/app/alerts');
  revalidatePath('/app/dashboard');
  return {};
}

/** Generate alerts for the given org from account health, missed inspections, AR aging, margin rules. Replaces open alerts. */
export async function generateAlertsForOrg(orgId: string): Promise<{ created: number; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { created: 0, error: 'Forbidden' };
  } catch {
    return { created: 0, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5).toISOString();

  // Delete existing open alerts so we refresh
  await supabase.from('alerts').delete().eq('org_id', orgId).eq('status', 'open');

  const toInsert: Array<{
    org_id: string;
    type: AlertType;
    severity: AlertSeverity;
    entity_type: string;
    entity_id: string | null;
    title: string;
    body: string | null;
    signals: AlertSignal[];
  }> = [];

  // 1) Account health decay: accounts with avg inspection score < 60 (30d)
  const { data: facilities } = await supabase.from('facilities').select('id, account_id, name').eq('org_id', orgId);
  const { data: accounts } = await supabase.from('accounts').select('id, name').eq('org_id', orgId);
  const { data: inspScores } = await supabase
    .from('inspections')
    .select('facility_id, total_score, score')
    .eq('org_id', orgId)
    .not('total_score', 'is', null)
    .gte('created_at', thirtyDaysAgo);

  const facilityToAccount = new Map<string, { accountId: string; name: string }>();
  (facilities ?? []).forEach((f: { id: string; account_id: string; name?: string }) => {
    const acc = (accounts ?? []).find((a: { id: string }) => a.id === f.account_id) as { id: string; name: string } | undefined;
    facilityToAccount.set(f.id, { accountId: f.account_id, name: acc?.name ?? f.name ?? 'Account' });
  });
  const scoresByAccount = new Map<string, number[]>();
  (inspScores ?? []).forEach((r: { facility_id: string; total_score: number | null; score?: number | null }) => {
    const info = facilityToAccount.get(r.facility_id);
    if (!info) return;
    const s = r.score ?? r.total_score;
    if (s == null) return;
    if (!scoresByAccount.has(info.accountId)) scoresByAccount.set(info.accountId, []);
    scoresByAccount.get(info.accountId)!.push(s);
  });

  scoresByAccount.forEach((scores, accountId) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 60) return;
    const acc = (accounts ?? []).find((a: { id: string }) => a.id === accountId) as { name: string } | undefined;
    const name = acc?.name ?? 'Account';
    toInsert.push({
      org_id: orgId,
      type: 'account_health_decay',
      severity: avg < 50 ? 'critical' : 'high',
      entity_type: 'account',
      entity_id: accountId,
      title: `Account health below threshold: ${name}`,
      body: `30-day average inspection score is ${avg.toFixed(1)} (threshold 60).`,
      signals: [
        { label: '30-day avg score', value: avg.toFixed(1) },
        { label: 'Inspections in period', value: String(scores.length) },
      ],
    });
  });

  // 2) Missed inspections: facilities with schedule but no inspection in 7d
  const { data: schedList } = await supabase.from('schedules').select('id, facility_id').eq('org_id', orgId).eq('is_active', true);
  const facilityIdsWithSchedule = new Set((schedList ?? []).map((s: { facility_id: string }) => s.facility_id));
  const { data: recentInsp } = await supabase
    .from('inspections')
    .select('facility_id')
    .eq('org_id', orgId)
    .gte('created_at', sevenDaysAgo);
  const facilityIdsWithRecentInsp = new Set((recentInsp ?? []).map((i: { facility_id: string }) => i.facility_id));

  facilityIdsWithSchedule.forEach((facilityId) => {
    if (facilityIdsWithRecentInsp.has(facilityId)) return;
    const fac = (facilities ?? []).find((f: { id: string }) => f.id === facilityId) as { name?: string } | undefined;
    toInsert.push({
      org_id: orgId,
      type: 'missed_inspection',
      severity: 'medium',
      entity_type: 'facility',
      entity_id: facilityId,
      title: `Missed inspection: ${fac?.name ?? 'Facility'}`,
      body: 'No inspection in the last 7 days for a scheduled facility.',
      signals: [
        { label: 'Facility', value: fac?.name ?? facilityId },
        { label: 'Last 7 days', value: 'No inspection' },
      ],
    });
  });

  // 3) AR aging: org-level alert for 30+/60+/90+ buckets
  const { data: arInvoices } = await supabase
    .from('invoices')
    .select('total_amount, due_date')
    .eq('org_id', orgId)
    .not('status', 'in', '("paid","cancelled","refunded")');

  let overdue30 = 0,
    overdue60 = 0,
    overdue90 = 0;
  const todayTs = new Date(today).getTime();
  (arInvoices ?? []).forEach((inv: { total_amount: number; due_date: string }) => {
    const amt = Number(inv.total_amount) || 0;
    const due = new Date(inv.due_date).getTime();
    const daysOver = (todayTs - due) / 864e5;
    if (daysOver > 90) overdue90 += amt;
    else if (daysOver > 60) overdue60 += amt;
    else if (daysOver > 30) overdue30 += amt;
  });

  const totalAr = overdue30 + overdue60 + overdue90;
  if (totalAr > 0) {
    const severity: AlertSeverity = overdue90 > 0 ? 'critical' : overdue60 > 0 ? 'high' : 'medium';
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    toInsert.push({
      org_id: orgId,
      type: 'ar_aging',
      severity,
      entity_type: 'org',
      entity_id: null,
      title: 'AR aging: outstanding past due',
      body: `Total outstanding past 30+ days: ${fmt(totalAr)}.`,
      signals: [
        { label: '30–60 days', value: fmt(overdue30), detail: 'Amount overdue 30–60 days' },
        { label: '60–90 days', value: fmt(overdue60), detail: 'Amount overdue 60–90 days' },
        { label: '90+ days', value: fmt(overdue90), detail: 'Amount overdue 90+ days' },
      ],
    });
  }

  // 4) Margin leakage: placeholder (no margin table)
  // Skip or add one informational alert
  // toInsert.push({ org_id: orgId, type: 'margin_leakage', severity: 'low', entity_type: 'org', entity_id: null, title: 'Margin rules', body: 'Margin leakage rules will appear when data is available.', signals: [] });

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('alerts').insert(
      toInsert.map((row) => ({ ...row, status: 'open' }))
    );
    if (insertError) return { created: 0, error: insertError.message };
  }

  revalidatePath('/app/alerts');
  revalidatePath('/app/dashboard');
  return { created: toInsert.length };
}
