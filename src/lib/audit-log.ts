/**
 * Server-only audit logging. Call from server actions after mutations.
 * before_state/after_state are sanitized so tokens, secrets, and passwords are never stored.
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';

const SENSITIVE_KEY_PATTERN = /^(password|token|secret|api_key|refresh_token|access_token|auth_token|private_key|credential|bearer)$/i;

function sanitizeState(state: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!state || typeof state !== 'object') return state;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(state)) {
    if (SENSITIVE_KEY_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out;
}

export type AuditAction =
  | 'pricing_change'
  | 'proposal_edit'
  | 'contract_frequency_change'
  | 'inspection_score_change'
  | 'invoice_edit'
  | 'account_update'
  | 'invoice_create'
  | 'deal_won';

export async function logAudit(params: {
  orgId: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  actorUserId?: string | null;
  ip?: string | null;
}): Promise<void> {
  const userId = params.actorUserId ?? (await getCurrentUserId());
  const supabase = await createClient();
  await supabase.from('audit_log').insert({
    org_id: params.orgId,
    actor_user_id: userId ?? null,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    before_state: sanitizeState(params.beforeState),
    after_state: sanitizeState(params.afterState),
    ip: params.ip ?? null,
  });
}
