import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app/risk/accounts
 * Query: risk_level, min_score, territory_id, assigned_operator_id (operator_id filter)
 * Returns accounts with risk snapshots (risk badges).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { searchParams } = new URL(request.url);
    const risk_level = searchParams.get('risk_level');
    const min_score = searchParams.get('min_score');
    const territory_id = searchParams.get('territory_id');
    const assigned_operator_id = searchParams.get('assigned_operator_id');

    const supabase = await createClient();
    let q = supabase
      .from('account_risk_snapshots')
      .select('id, account_id, operator_type, operator_id, risk_score, risk_level, reasons, status, updated_at')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (risk_level) q = q.eq('risk_level', risk_level);
    if (min_score) {
      const n = parseInt(min_score, 10);
      if (!Number.isNaN(n)) q = q.gte('risk_score', n);
    }
    if (assigned_operator_id) q = q.eq('operator_id', assigned_operator_id);

    const { data: snapshots, error } = await q.order('risk_score', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let list = (snapshots ?? []) as Array<{
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

    if (territory_id) {
      const facilityAccountIds = await supabase
        .from('facilities')
        .select('account_id')
        .eq('org_id', orgId)
        .eq('territory_id', territory_id);
      const ids = new Set((facilityAccountIds.data ?? []).map((r: { account_id: string }) => r.account_id));
      list = list.filter((s) => ids.has(s.account_id));
    }

    const accountIds = [...new Set(list.map((s) => s.account_id))];
    const accountNames = new Map<string, string>();
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
      for (const a of accounts ?? []) accountNames.set((a as { id: string; name: string }).id, (a as { name: string }).name);
    }

    const payload = list.map((s) => ({
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

    return NextResponse.json({ data: payload });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
