/**
 * Widget layout persistence: fetch, save, merge with defaults
 */
import { createClient } from '@/lib/supabase/client';
import type { BreakpointKey, LayoutItem, WidgetDefinition } from './types';

const TABLE = 'user_widget_layouts';

export interface SavedLayoutState {
  layout: LayoutItem[];
  hiddenWidgets: string[];
}

/**
 * Fetch saved layout for (orgId, userId, moduleKey, breakpoint)
 */
export async function fetchSavedLayout(
  orgId: string,
  userId: string,
  moduleKey: string,
  breakpoint: BreakpointKey
): Promise<SavedLayoutState | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('layout, hidden_widgets')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('module_key', moduleKey)
    .eq('breakpoint', breakpoint)
    .maybeSingle();

  if (error || !data) return null;
  return {
    layout: (data.layout as LayoutItem[]) ?? [],
    hiddenWidgets: (data.hidden_widgets as string[]) ?? [],
  };
}

/**
 * Fetch all saved layouts for a module (all breakpoints) for current user
 */
export async function fetchSavedLayoutsForModule(
  orgId: string,
  userId: string,
  moduleKey: string
): Promise<Partial<Record<BreakpointKey, SavedLayoutState>>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('breakpoint, layout, hidden_widgets')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('module_key', moduleKey);

  if (error || !data) return {};
  const out: Partial<Record<BreakpointKey, SavedLayoutState>> = {};
  for (const row of data) {
    const bp = row.breakpoint as BreakpointKey;
    out[bp] = {
      layout: (row.layout as LayoutItem[]) ?? [],
      hiddenWidgets: (row.hidden_widgets as string[]) ?? [],
    };
  }
  return out;
}

/**
 * Save layout + hidden widgets for one breakpoint
 */
export async function saveLayout(
  orgId: string,
  userId: string,
  moduleKey: string,
  breakpoint: BreakpointKey,
  layout: LayoutItem[],
  hiddenWidgets: string[]
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.from(TABLE).upsert(
    {
      org_id: orgId,
      user_id: userId,
      module_key: moduleKey,
      breakpoint,
      layout,
      hidden_widgets: hiddenWidgets,
    },
    {
      onConflict: 'org_id,user_id,module_key,breakpoint',
    }
  );
  return { error: error ?? null };
}

/**
 * Delete saved layouts for a module (Reset to default)
 */
export async function resetLayoutsForModule(
  orgId: string,
  userId: string,
  moduleKey: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('module_key', moduleKey);
  return { error: error ?? null };
}

/**
 * Build default layout array from widget definitions for a breakpoint.
 * Uses default.x, default.y, default.w, default.h from each widget's default[breakpoint].
 */
export function getDefaultLayoutForBreakpoint(
  widgets: WidgetDefinition[],
  breakpoint: BreakpointKey,
  excludeHidden: string[] = []
): LayoutItem[] {
  const items: LayoutItem[] = [];
  widgets.forEach((def, index) => {
    if (excludeHidden.includes(def.id)) return;
    const d = def.default[breakpoint] ?? def.default.lg ?? def.default.md ?? def.default.sm;
    const defLayout: LayoutItem = {
      i: def.id,
      x: d?.x ?? (index % 4) * 3,
      y: Math.floor(index / 4) * 2,
      w: d?.w ?? 1,
      h: d?.h ?? 1,
      minW: def.minW ?? 1,
      minH: def.minH ?? 1,
      maxW: def.maxW,
      maxH: def.maxH,
    };
    if (d?.x !== undefined) defLayout.x = d.x;
    if (d?.y !== undefined) defLayout.y = d.y;
    if (d?.w !== undefined) defLayout.w = d.w;
    if (d?.h !== undefined) defLayout.h = d.h;
    items.push(defLayout);
  });
  return items;
}

/**
 * Merge saved layout with current widget definitions:
 * - Start from default layout for this breakpoint
 * - Apply saved positions/sizes for widgets that exist in definitions
 * - Append new widgets (in definitions but not in saved) with sensible defaults
 * - Exclude widgets in hiddenWidgets
 */
export function mergeLayoutWithDefaults(
  saved: SavedLayoutState | null,
  widgets: WidgetDefinition[],
  breakpoint: BreakpointKey
): LayoutItem[] {
  const hidden = saved?.hiddenWidgets ?? [];
  const visibleWidgets = widgets.filter((w) => !hidden.includes(w.id));
  const defaultLayout = getDefaultLayoutForBreakpoint(visibleWidgets, breakpoint, []);

  if (!saved?.layout?.length) return defaultLayout;

  const byId = new Map<string, LayoutItem>();
  defaultLayout.forEach((item) => byId.set(item.i, { ...item }));

  saved.layout.forEach((item) => {
    if (!item || typeof item.i !== 'string') return;
    if (!visibleWidgets.some((w) => w.id === item.i)) return;
    byId.set(item.i, {
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
      static: item.static,
    });
  });

  return Array.from(byId.values());
}
