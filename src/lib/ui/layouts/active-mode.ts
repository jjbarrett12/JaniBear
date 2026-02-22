/**
 * Get/set active layout mode per user per org per module (user_ui_prefs). SSR-safe.
 */
import type { LayoutMode } from './types';

const TABLE = 'user_ui_prefs';

export async function getActiveLayoutMode(
  supabase: { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { active_layout_mode: string } | null }> } } } } } },
  userId: string,
  orgId: string,
  moduleKey: string
): Promise<LayoutMode> {
  const { data } = await supabase
    .from(TABLE)
    .select('active_layout_mode')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .eq('module_key', moduleKey)
    .maybeSingle();

  const mode = data?.active_layout_mode;
  if (mode === 'my' || mode === 'recommended' || mode === 'org_template') return mode;
  return 'recommended';
}

export async function setActiveLayoutMode(
  supabase: { from: (t: string) => { upsert: (row: object, opts: { onConflict: string }) => Promise<{ error: unknown }> } },
  userId: string,
  orgId: string,
  moduleKey: string,
  mode: LayoutMode
): Promise<{ error: unknown }> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      org_id: orgId,
      module_key: moduleKey,
      active_layout_mode: mode,
    },
    { onConflict: 'user_id,org_id,module_key' }
  );
  return { error };
}
