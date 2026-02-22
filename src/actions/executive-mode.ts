'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DASHBOARD_MODULE = 'dashboard';

/** Get executive mode preference for current user in current org. Persisted in user_ui_prefs (module_key = dashboard). */
export async function getExecutiveMode(orgId: string): Promise<{ enabled: boolean; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { enabled: false, error: 'Forbidden' };
  } catch {
    return { enabled: false, error: 'Unauthorized' };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { enabled: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('user_ui_prefs')
    .select('executive_mode_enabled')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('module_key', DASHBOARD_MODULE)
    .maybeSingle();

  if (error) return { enabled: false, error: error.message };
  const row = data as { executive_mode_enabled?: boolean } | null;
  return { enabled: Boolean(row?.executive_mode_enabled) };
}

/** Set executive mode for current user in current org. Preserves active_layout_mode. */
export async function setExecutiveMode(orgId: string, enabled: boolean): Promise<{ error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { error: 'Forbidden' };
  } catch {
    return { error: 'Unauthorized' };
  }

  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('user_ui_prefs')
    .select('active_layout_mode')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('module_key', DASHBOARD_MODULE)
    .maybeSingle();

  const activeLayoutMode = (existing as { active_layout_mode?: string } | null)?.active_layout_mode;
  const mode = activeLayoutMode === 'my' || activeLayoutMode === 'org_template' ? activeLayoutMode : 'recommended';

  const { error } = await supabase.from('user_ui_prefs').upsert(
    {
      user_id: userId,
      org_id: orgId,
      module_key: DASHBOARD_MODULE,
      active_layout_mode: mode,
      executive_mode_enabled: enabled,
    },
    { onConflict: 'user_id,org_id,module_key' }
  );

  if (error) return { error: error.message };
  revalidatePath('/app/dashboard');
  return {};
}
