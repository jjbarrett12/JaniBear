/**
 * Run risk detection for one or all accounts: compute risk, recommend backups,
 * upsert snapshot, emit events and alerts on transition.
 */

import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAccountRisk } from './calculateAccountRisk';
import { recommendBackups } from './recommendBackups';

const DEFAULT_RISK_JUMP = 15;

export interface RunRiskInput {
  orgId: string;
  accountId?: string | null;
  supabase: SupabaseClient;
}

export async function runAccountRiskForOrg(input: RunRiskInput): Promise<{ processed: number; events: number }> {
  const { orgId, accountId, supabase } = input;

  const { data: settings } = await supabase
    .from('risk_settings')
    .select('enabled, risk_jump_alert')
    .eq('org_id', orgId)
    .maybeSingle();
  const enabled = (settings as { enabled?: boolean } | null)?.enabled ?? true;
  const riskJumpAlert = (settings as { risk_jump_alert?: number } | null)?.risk_jump_alert ?? DEFAULT_RISK_JUMP;

  if (!enabled) return { processed: 0, events: 0 };

  let accountIds: string[] = [];
  if (accountId) {
    accountIds = [accountId];
  } else {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'active');
    accountIds = (accounts ?? []).map((a: { id: string }) => a.id);
  }

  let processed = 0;
  let eventsCreated = 0;

  for (const aid of accountIds) {
    const result = await runOneAccount(supabase, orgId, aid, riskJumpAlert);
    if (result) {
      processed += 1;
      if (result.eventCreated) eventsCreated += 1;
    }
  }

  return { processed, events: eventsCreated };
}

async function runOneAccount(
  supabase: SupabaseClient,
  orgId: string,
  accountId: string,
  riskJumpAlert: number
): Promise<{ eventCreated: boolean } | null> {
  const calculated = await calculateAccountRisk(supabase, orgId, accountId);
  if (!calculated) return null;

  const { result, operator_type, operator_id } = calculated;
  const { risk_score, risk_level, reasons, metrics } = result;

  const facilityWithCoords = await getAccountLocation(supabase, orgId, accountId);
  let recommended_backups: Record<string, unknown>[] = [];
  if (facilityWithCoords) {
    const backups = await recommendBackups({
      org_id: orgId,
      account_lat: facilityWithCoords.lat,
      account_lng: facilityWithCoords.lng,
      territory_id: facilityWithCoords.territory_id ?? null,
      limit: 3,
    });
    recommended_backups = backups.map((b) => ({
      operator_type: b.operator_type,
      operator_id: b.operator_id,
      operator_name: b.operator_name,
      score: b.score,
      distance: b.distance_miles,
      capacity: b.capacity_score,
      rationale: b.rationale,
    }));
  }

  const { data: previous } = await supabase
    .from('account_risk_snapshots')
    .select('risk_score, risk_level')
    .eq('org_id', orgId)
    .eq('account_id', accountId)
    .maybeSingle();

  const prevScore = (previous as { risk_score?: number } | null)?.risk_score ?? 0;
  const prevLevel = (previous as { risk_level?: string } | null)?.risk_level ?? 'low';
  const scoreJump = risk_score - prevScore;
  const levelWorsened =
    (prevLevel === 'low' && (risk_level === 'medium' || risk_level === 'high' || risk_level === 'critical')) ||
    (prevLevel === 'medium' && (risk_level === 'high' || risk_level === 'critical')) ||
    (prevLevel === 'high' && risk_level === 'critical');

  const shouldCreateEvent = levelWorsened || scoreJump >= riskJumpAlert;

  await supabase.from('account_risk_snapshots').upsert(
    {
      org_id: orgId,
      account_id: accountId,
      operator_type,
      operator_id,
      risk_score,
      risk_level,
      reasons,
      metrics: metrics as unknown as Record<string, unknown>,
      recommended_backups,
      status: 'active',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,account_id' }
  );

  if (shouldCreateEvent) {
    await supabase.from('account_risk_events').insert({
      org_id: orgId,
      account_id: accountId,
      actor_user_id: null,
      action: 'risk_detected',
      meta: { risk_score, risk_level, prev_score: prevScore, prev_level: prevLevel },
    });

    const severity = risk_level === 'critical' ? 'critical' : risk_level === 'high' ? 'high' : 'medium';
    await supabase.from('alerts').insert({
      org_id: orgId,
      type: 'account_at_risk',
      severity,
      entity_type: 'account',
      entity_id: accountId,
      title: `Account at risk: ${risk_level}`,
      body: reasons.length ? reasons.join('; ') : 'Risk score increased.',
      status: 'open',
      signals: reasons.map((r) => ({ label: 'Reason', value: r })),
    });
    return { eventCreated: true };
  }
  return { eventCreated: false };
}

async function getAccountLocation(
  supabase: SupabaseClient,
  orgId: string,
  accountId: string
): Promise<{ lat: number; lng: number; territory_id?: string | null } | null> {
  const { data } = await supabase
    .from('facilities')
    .select('latitude, longitude, territory_id')
    .eq('org_id', orgId)
    .eq('account_id', accountId)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(1)
    .maybeSingle();
  const row = data as { latitude: number; longitude: number; territory_id?: string | null } | null;
  return row ? { lat: row.latitude, lng: row.longitude, territory_id: row.territory_id } : null;
}
