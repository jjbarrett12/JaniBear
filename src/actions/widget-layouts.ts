'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type { BreakpointKey } from '@/lib/widgets/types';
import type { LayoutItem } from '@/lib/widgets/types';

const BREAKPOINTS: BreakpointKey[] = ['lg', 'md', 'sm'];
const ADMIN_ROLES = ['owner', 'admin', 'manager'];

async function assertLayoutAdmin(orgId: string): Promise<void> {
  const org = await requireOrg();
  if (org.org_id !== orgId) throw new Error('Forbidden');
  const role = (org as { role?: string }).role;
  if (!role || !ADMIN_ROLES.includes(role.toLowerCase())) throw new Error('Only org admins can manage templates');
}

/**
 * Save current layout as org template for module_key + role (all breakpoints).
 * Admin only. Creates or updates rows for lg, md, sm with same name and is_locked.
 * @param isLocked - When provided, sets template lock; when omitted, keeps existing lock on update or false on create.
 */
export async function saveOrgTemplate(
  orgId: string,
  moduleKey: string,
  role: string,
  name: string,
  layoutsByBreakpoint: Record<BreakpointKey, LayoutItem[]>,
  isLocked?: boolean
): Promise<{ error?: string }> {
  try {
    await assertLayoutAdmin(orgId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }

  const supabase = await createClient();
  const existing = await supabase
    .from('widget_layout_templates')
    .select('breakpoint, is_locked')
    .eq('org_id', orgId)
    .eq('module_key', moduleKey)
    .eq('role', role);

  const existingLock = (existing.data ?? []).find((r) => r.breakpoint === 'lg') as { is_locked?: boolean } | undefined;
  const resolvedLock = isLocked !== undefined ? isLocked : (existingLock?.is_locked ?? false);

  for (const bp of BREAKPOINTS) {
    const layout = layoutsByBreakpoint[bp] ?? [];
    const { error } = await supabase.from('widget_layout_templates').upsert(
      {
        org_id: orgId,
        module_key: moduleKey,
        role,
        breakpoint: bp,
        layout,
        name: name.trim() || null,
        is_locked: resolvedLock,
      },
      { onConflict: 'org_id,module_key,role,breakpoint' }
    );
    if (error) return { error: error.message };
  }

  revalidatePath('/app/dashboard');
  revalidatePath('/app/kpis');
  return {};
}

/**
 * Set lock state for org template (module_key + role). Admin only.
 * All three breakpoint rows are updated to the same is_locked value.
 */
export async function setOrgTemplateLock(
  orgId: string,
  moduleKey: string,
  role: string,
  isLocked: boolean
): Promise<{ error?: string }> {
  try {
    await assertLayoutAdmin(orgId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('widget_layout_templates')
    .update({ is_locked: isLocked })
    .eq('org_id', orgId)
    .eq('module_key', moduleKey)
    .eq('role', role);

  if (error) return { error: error.message };
  revalidatePath('/app/dashboard');
  revalidatePath('/app/kpis');
  return {};
}

/**
 * Apply org template to team: optionally set every org member's user_widget_layouts for this module
 * to the template and set their active_layout_mode to 'org_template'.
 * Admin only.
 */
export async function applyTemplateToTeam(
  orgId: string,
  moduleKey: string,
  role: string,
  pushToUsers: boolean
): Promise<{ error?: string; appliedCount?: number }> {
  try {
    await assertLayoutAdmin(orgId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }

  if (!pushToUsers) return { appliedCount: 0 };

  const supabase = await createClient();

  const { data: templateRows } = await supabase
    .from('widget_layout_templates')
    .select('breakpoint, layout')
    .eq('org_id', orgId)
    .eq('module_key', moduleKey)
    .eq('role', role);

  if (!templateRows?.length) return { error: 'Org template not found' };

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('org_id', orgId);

  if (!members?.length) return { appliedCount: 0 };

  let applied = 0;
  for (const m of members) {
    const userId = (m as { user_id: string }).user_id;
    for (const row of templateRows as { breakpoint: string; layout: LayoutItem[] }[]) {
      await supabase.from('user_widget_layouts').upsert(
        {
          org_id: orgId,
          user_id: userId,
          module_key: moduleKey,
          breakpoint: row.breakpoint,
          layout: row.layout,
          hidden_widgets: [],
        },
        { onConflict: 'org_id,user_id,module_key,breakpoint' }
      );
    }
    await supabase.from('user_ui_prefs').upsert(
      {
        user_id: userId,
        org_id: orgId,
        module_key: moduleKey,
        active_layout_mode: 'org_template',
      },
      { onConflict: 'user_id,org_id,module_key' }
    );
    applied++;
  }

  revalidatePath('/app/dashboard');
  revalidatePath('/app/kpis');
  return { appliedCount: applied };
}

/**
 * Get org template meta (name, is_locked) for module_key + role. Uses first row (e.g. lg).
 */
export async function getOrgTemplateMeta(
  orgId: string,
  moduleKey: string,
  role: string
): Promise<{ name: string | null; isLocked: boolean } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('widget_layout_templates')
    .select('name, is_locked')
    .eq('org_id', orgId)
    .eq('module_key', moduleKey)
    .eq('role', role)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    name: (data as { name?: string | null }).name ?? null,
    isLocked: Boolean((data as { is_locked?: boolean }).is_locked),
  };
}
