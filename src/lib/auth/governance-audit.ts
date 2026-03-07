/**
 * Governance audit logging — writes to audit_logs for critical actions.
 * Use for: user_invited, role_changed, crew_assignment, crew_replacement,
 * proposal_approval, settings_changes, billing_changes.
 * Server-only.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';

export type GovernanceAuditEvent =
  | 'user_invited'
  | 'role_changed'
  | 'crew_assignment'
  | 'crew_replacement'
  | 'proposal_approval'
  | 'settings_changes'
  | 'billing_changes';

export async function logGovernanceAudit(params: {
  orgId: string;
  eventType: GovernanceAuditEvent;
  targetTable?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown> | null;
  actorUserId?: string | null;
}): Promise<void> {
  const userId = params.actorUserId ?? (await getCurrentUserId());
  const supabase = await createClient();
  await supabase.from('audit_logs').insert({
    org_id: params.orgId,
    actor_user_id: userId ?? null,
    event_type: params.eventType,
    target_table: params.targetTable ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });
}
