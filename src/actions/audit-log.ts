'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';

const ADMIN_ROLES = ['owner', 'admin', 'manager'];

export type AuditLogEntry = {
  id: string;
  org_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
  ip: string | null;
};

function toEntry(r: Record<string, unknown>): AuditLogEntry {
  return {
    id: r.id as string,
    org_id: r.org_id as string,
    actor_user_id: (r.actor_user_id as string) ?? null,
    action: r.action as string,
    entity_type: r.entity_type as string,
    entity_id: (r.entity_id as string) ?? null,
    before_state: (r.before_state as Record<string, unknown>) ?? null,
    after_state: (r.after_state as Record<string, unknown>) ?? null,
    created_at: r.created_at as string,
    ip: (r.ip as string) ?? null,
  };
}

export async function listAuditLog(
  orgId: string,
  filters?: { fromDate?: string; toDate?: string; entityType?: string; entityId?: string; actorUserId?: string }
): Promise<{ entries: AuditLogEntry[]; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { entries: [], error: 'Forbidden' };
    const role = (org as { role?: string }).role;
    if (!role || !ADMIN_ROLES.includes(role.toLowerCase())) return { entries: [], error: 'Only org admins can view audit log' };
  } catch {
    return { entries: [], error: 'Unauthorized' };
  }

  const supabase = await createClient();
  let q = supabase
    .from('audit_log')
    .select('id, org_id, actor_user_id, action, entity_type, entity_id, before_state, after_state, created_at, ip')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters?.fromDate) q = q.gte('created_at', filters.fromDate.includes('T') ? filters.fromDate : filters.fromDate + 'T00:00:00.000Z');
  if (filters?.toDate) q = q.lte('created_at', filters.toDate.includes('T') ? filters.toDate : filters.toDate + 'T23:59:59.999Z');
  if (filters?.entityType) q = q.eq('entity_type', filters.entityType);
  if (filters?.entityId) q = q.eq('entity_id', filters.entityId);
  if (filters?.actorUserId) q = q.eq('actor_user_id', filters.actorUserId);

  const { data, error } = await q;
  if (error) return { entries: [], error: error.message };
  return { entries: (data ?? []).map(toEntry) };
}

export async function getAuditLogEntry(orgId: string, entryId: string): Promise<{ entry: AuditLogEntry | null; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { entry: null, error: 'Forbidden' };
    const role = (org as { role?: string }).role;
    if (!role || !ADMIN_ROLES.includes(role.toLowerCase())) return { entry: null, error: 'Only org admins can view audit log' };
  } catch {
    return { entry: null, error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('audit_log').select('*').eq('id', entryId).eq('org_id', orgId).maybeSingle();
  if (error) return { entry: null, error: error.message };
  return { entry: data ? toEntry(data) : null };
}

export async function listAuditLogActors(orgId: string): Promise<{ actors: Array<{ user_id: string; full_name: string | null }>; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { actors: [], error: 'Forbidden' };
    const role = (org as { role?: string }).role;
    if (!role || !ADMIN_ROLES.includes(role.toLowerCase())) return { actors: [], error: 'Only org admins can view audit log' };
  } catch {
    return { actors: [], error: 'Unauthorized' };
  }

  const supabase = await createClient();
  const { data: ids } = await supabase.from('audit_log').select('actor_user_id').eq('org_id', orgId).not('actor_user_id', 'is', null);
  const userIds = [...new Set((ids ?? []).map((r: { actor_user_id: string }) => r.actor_user_id))];
  if (userIds.length === 0) return { actors: [] };

  const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
  const actors = (profiles ?? []).map((p: { id: string; full_name: string | null }) => ({ user_id: p.id, full_name: p.full_name }));
  return { actors };
}
