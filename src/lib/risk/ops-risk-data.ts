/**
 * Server-side data for Ops dashboard: accounts at risk (high + critical).
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface AccountAtRiskRow {
  id: string;
  account_id: string;
  account_name: string;
  operator_type: string;
  operator_id: string;
  risk_score: number;
  risk_level: string;
  top_reason: string | null;
  status: string;
  updated_at: string;
}

export async function getAccountsAtRiskForOps(orgId: string): Promise<{
  count: number;
  list: AccountAtRiskRow[];
}> {
  const supabase = await createClient();
  const { data: snapshots } = await supabase
    .from('account_risk_snapshots')
    .select('id, account_id, operator_type, operator_id, risk_score, risk_level, reasons, status, updated_at')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .in('risk_level', ['high', 'critical'])
    .order('risk_score', { ascending: false });

  const list = (snapshots ?? []) as Array<{
    id: string;
    account_id: string;
    operator_type: string;
    operator_id: string;
    risk_score: number;
    risk_level: string;
    reasons: string[];
    status: string;
    updated_at: string;
  }>;

  const accountIds = [...new Set(list.map((s) => s.account_id))];
  const accountNames = new Map<string, string>();
  if (accountIds.length > 0) {
    const { data: accounts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
    for (const a of accounts ?? []) accountNames.set((a as { id: string; name: string }).id, (a as { name: string }).name);
  }

  const rows: AccountAtRiskRow[] = list.map((s) => ({
    id: s.id,
    account_id: s.account_id,
    account_name: accountNames.get(s.account_id) ?? '',
    operator_type: s.operator_type,
    operator_id: s.operator_id,
    risk_score: s.risk_score,
    risk_level: s.risk_level,
    top_reason: s.reasons?.[0] ?? null,
    status: s.status,
    updated_at: s.updated_at,
  }));

  return { count: rows.length, list: rows };
}
