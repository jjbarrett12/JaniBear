'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/user-context';
import type { AiOrgConfigRow, AiModuleStateRow, AiAutomationRuleRow, AiAuditLogRow } from './types';
import { AI_TRIGGER_TYPES, AI_ACTION_TYPES, AI_MODULE_KEYS } from './types';

const REDACTION_LEVELS = ['none', 'basic', 'aggressive'] as const;
const RESPONSE_LENGTHS = ['short', 'standard', 'detailed'] as const;
const CONFIDENCE_LEVELS = ['low', 'med', 'high'] as const;

function requireAiAdmin(orgId: string) {
  return async () => {
    const { context } = await getUserContext();
    if (!context.activeOrgId || context.activeOrgId !== orgId)
      throw new Error('Unauthorized');
    const role = (context.role ?? context.effectiveRole ?? '').toLowerCase();
    const canManage = ['owner', 'admin', 'manager'].includes(role) || context.capabilities['ai_settings.manage'];
    if (!canManage) throw new Error('Only admins can change AI settings');
  };
}

async function insertAudit(orgId: string, userId: string, action: string, entityType: string, entityId: string | null, changes: Record<string, unknown> | null) {
  const supabase = await createClient();
  await supabase.from('ai_audit_log').insert({
    org_id: orgId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    changes,
  });
}

export async function getAiOrgConfig(orgId: string): Promise<AiOrgConfigRow | null> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_org_config')
    .select('*')
    .eq('org_id', orgId)
    .maybeSingle();
  return data as AiOrgConfigRow | null;
}

const configPatchSchema = z.object({
  ai_enabled: z.boolean().optional(),
  budget_limit_cents: z.number().int().min(0).nullable().optional(),
  budget_hard_cap: z.boolean().optional(),
  budget_monthly_cents: z.number().int().min(0).nullable().optional(),
  hard_cap_enabled: z.boolean().optional(),
  notify_at_percent: z.number().int().min(0).max(100).nullable().optional(),
  notify_channel: z.enum(['in_app', 'email', 'slack']).optional(),
  data_access: z.record(z.boolean()).optional(),
  redaction_level: z.enum(REDACTION_LEVELS).optional(),
  retain_prompts: z.boolean().optional(),
  retain_prompts_days: z.number().int().min(0).max(365).optional(),
  model_key: z.string().optional(),
  model_preset: z.string().optional(),
  temperature: z.number().min(0.2).max(0.9).optional(),
  response_length: z.enum(RESPONSE_LENGTHS).optional(),
  confidence_threshold: z.enum(CONFIDENCE_LEVELS).optional(),
  use_cheaper_model_drafts: z.boolean().optional(),
  cheap_drafts: z.boolean().optional(),
  provider: z.enum(['openai', 'byok']).optional(),
});

function mapConfigPatchToDb(p: z.infer<typeof configPatchSchema>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...p };
  if (p.budget_monthly_cents !== undefined) out.budget_limit_cents = p.budget_monthly_cents;
  if (p.hard_cap_enabled !== undefined) out.budget_hard_cap = p.hard_cap_enabled;
  if (p.model_preset !== undefined) out.model_key = p.model_preset;
  if (p.cheap_drafts !== undefined) out.use_cheaper_model_drafts = p.cheap_drafts;
  delete out.budget_monthly_cents;
  delete out.hard_cap_enabled;
  delete out.model_preset;
  delete out.cheap_drafts;
  return out;
}

export async function updateAiOrgConfig(orgId: string, patch: z.infer<typeof configPatchSchema>): Promise<{ error?: string }> {
  return upsertAiOrgConfig(orgId, patch);
}

export async function upsertAiOrgConfig(orgId: string, patch: z.infer<typeof configPatchSchema>): Promise<{ error?: string }> {
  await requireAiAdmin(orgId)();
  const parsed = configPatchSchema.safeParse(patch);
  if (!parsed.success) return { error: parsed.error.message };
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id ?? '';

  const dbPatch = mapConfigPatchToDb(parsed.data);
  const { error } = await supabase.from('ai_org_config').upsert(
    {
      org_id: orgId,
      ...dbPatch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' }
  );
  if (error) return { error: error.message };
  try { await insertAudit(orgId, userId, 'upsert', 'ai_org_config', orgId, dbPatch); } catch (_) {}
  revalidatePath('/app/settings/ai');
  return {};
}

export async function listAiModules(orgId: string): Promise<AiModuleStateRow[]> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_module_state')
    .select('*')
    .eq('org_id', orgId);
  return (data ?? []) as AiModuleStateRow[];
}

export async function updateAiModule(orgId: string, moduleKey: string, patch: { enabled?: boolean; settings?: Record<string, unknown> }): Promise<{ error?: string }> {
  await requireAiAdmin(orgId)();
  if (!AI_MODULE_KEYS.includes(moduleKey as any)) return { error: 'Invalid module key' };
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id ?? '';

  const { error } = await supabase.from('ai_module_state').upsert(
    {
      org_id: orgId,
      module_key: moduleKey,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,module_key' }
  );
  if (error) return { error: error.message };
  try { await insertAudit(orgId, userId, 'update', 'ai_module_state', moduleKey, patch); } catch (_) {}
  revalidatePath('/app/settings/ai');
  return {};
}

export async function toggleAiModule(orgId: string, moduleKey: string, enabled: boolean): Promise<{ error?: string }> {
  return updateAiModule(orgId, moduleKey, { enabled });
}

export async function updateAiModuleConfig(orgId: string, moduleKey: string, configPatch: Record<string, unknown>): Promise<{ error?: string }> {
  return updateAiModule(orgId, moduleKey, { settings: configPatch });
}

const ruleSchema = z.object({
  name: z.string().min(1),
  enabled: z.boolean(),
  trigger_type: z.enum(AI_TRIGGER_TYPES),
  trigger_params: z.record(z.unknown()).default({}),
  conditions: z.array(z.unknown()).default([]),
  actions: z.array(z.object({ type: z.enum(AI_ACTION_TYPES), params: z.record(z.unknown()).optional() })),
  notify_settings: z.record(z.unknown()).default({}),
  cooldown_minutes: z.number().int().min(0).default(60),
});

export async function listAiRules(orgId: string): Promise<AiAutomationRuleRow[]> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_automation_rules')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  return (data ?? []) as AiAutomationRuleRow[];
}

export async function createOrUpdateAiRule(orgId: string, rulePayload: {
  id?: string; name: string; enabled: boolean; trigger_type: string;
  trigger_params?: Record<string, unknown>; conditions?: unknown[]; actions?: unknown[];
  notify_settings?: Record<string, unknown>; cooldown_minutes?: number;
}): Promise<{ error?: string }> {
  return upsertAiRule(orgId, rulePayload);
}

export async function upsertAiRule(orgId: string, rule: { id?: string; name: string; enabled: boolean; trigger_type: string; trigger_params?: Record<string, unknown>; conditions?: unknown[]; actions?: unknown[]; notify_settings?: Record<string, unknown>; cooldown_minutes?: number }): Promise<{ error?: string }> {
  await requireAiAdmin(orgId)();
  const parsed = ruleSchema.safeParse(rule);
  if (!parsed.success) return { error: parsed.error.message };
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id ?? '';

  const payload = {
    org_id: orgId,
    name: parsed.data.name,
    enabled: parsed.data.enabled,
    trigger_type: parsed.data.trigger_type,
    trigger_params: parsed.data.trigger_params ?? {},
    conditions: parsed.data.conditions ?? [],
    actions: parsed.data.actions ?? [],
    notify_settings: parsed.data.notify_settings ?? {},
    cooldown_minutes: parsed.data.cooldown_minutes ?? 60,
    updated_at: new Date().toISOString(),
  };

  if (rule.id) {
    const { error } = await supabase.from('ai_automation_rules').update(payload).eq('id', rule.id).eq('org_id', orgId);
    if (error) return { error: error.message };
    try { await insertAudit(orgId, userId, 'update', 'ai_automation_rule', rule.id, payload); } catch (_) {}
  } else {
    const { error } = await supabase.from('ai_automation_rules').insert(payload);
    if (error) return { error: error.message };
    try { await insertAudit(orgId, userId, 'create', 'ai_automation_rule', null, payload); } catch (_) {}
  }
  revalidatePath('/app/settings/ai');
  return {};
}

export async function deleteAiRule(orgId: string, ruleId: string): Promise<{ error?: string }> {
  await requireAiAdmin(orgId)();
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id ?? '';
  const { error } = await supabase.from('ai_automation_rules').delete().eq('id', ruleId).eq('org_id', orgId);
  if (error) return { error: error.message };
  try { await insertAudit(orgId, userId, 'delete', 'ai_automation_rule', ruleId, null); } catch (_) {}
  revalidatePath('/app/settings/ai');
  return {};
}

export async function getAiAuditLog(orgId: string, limit = 20): Promise<AiAuditLogRow[]> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_audit_log')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as AiAuditLogRow[];
}

export async function testAiConnection(orgId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAiAdmin(orgId)();
  const supabase = await createClient();
  const { data: config } = await supabase.from('ai_org_config').select('provider').eq('org_id', orgId).maybeSingle();
  if (config?.provider === 'byok') {
    // TODO: test with stored key
    return { ok: true };
  }
  return { ok: true };
}
