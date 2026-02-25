/**
 * Widget layout persistence: fetch, save, merge with defaults.
 * Uses localStorage first for instant load; DB is used when available (TODO: optional DB sync for cross-device).
 */
import { createClient } from '@/lib/supabase/client';
import type { BreakpointKey, LayoutItem, WidgetDefinition } from './types';

const TABLE = 'user_widget_layouts';
const LOCALSTORAGE_PREFIX = 'janibear_widget_layout';

function layoutStorageKey(orgId: string, userId: string, moduleKey: string): string {
  return `${LOCALSTORAGE_PREFIX}_${orgId}_${userId}_${moduleKey}`;
}

/**
 * Load layout + hidden widgets from localStorage (scoped by org_id and user_id).
 * Use for instant restore on mount; DB fetch can override when available.
 */
export function getLayoutFromLocalStorage(
  orgId: string,
  userId: string,
  moduleKey: string
): Partial<Record<BreakpointKey, SavedLayoutState>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(layoutStorageKey(orgId, userId, moduleKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { layout: LayoutItem[]; hiddenWidgets: string[] }>;
    const out: Partial<Record<BreakpointKey, SavedLayoutState>> = {};
    (['lg', 'md', 'sm'] as const).forEach((bp) => {
      const entry = parsed[bp];
      if (entry && Array.isArray(entry.layout)) {
        out[bp] = {
          layout: entry.layout,
          hiddenWidgets: Array.isArray(entry.hiddenWidgets) ? entry.hiddenWidgets : [],
        };
      }
    });
    return out;
  } catch {
    return {};
  }
}

/**
 * Save layout + hidden widgets to localStorage (scoped by org_id and user_id).
 * Called when user saves layout; DB is also written for persistence (TODO: make DB optional).
 */
export function setLayoutToLocalStorage(
  orgId: string,
  userId: string,
  moduleKey: string,
  byBreakpoint: Partial<Record<BreakpointKey, SavedLayoutState>>
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: Record<string, { layout: LayoutItem[]; hiddenWidgets: string[] }> = {};
    (['lg', 'md', 'sm'] as const).forEach((bp) => {
      const entry = byBreakpoint[bp];
      if (entry) {
        payload[bp] = { layout: entry.layout, hiddenWidgets: entry.hiddenWidgets };
      }
    });
    localStorage.setItem(layoutStorageKey(orgId, userId, moduleKey), JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

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
 * Fetch all saved layouts for a module (all breakpoints) for current user.
 * TODO: Optional DB persistence for cross-device sync; localStorage remains primary for instant load.
 */
export async function fetchSavedLayoutsForModule(
  orgId: string,
  userId: string,
  moduleKey: string
): Promise<Partial<Record<BreakpointKey, SavedLayoutState>>> {
  const fromLocal = getLayoutFromLocalStorage(orgId, userId, moduleKey);
  const supabase = createClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('breakpoint, layout, hidden_widgets')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('module_key', moduleKey);

  if (error || !data) return Object.keys(fromLocal).length ? fromLocal : {};
  const out: Partial<Record<BreakpointKey, SavedLayoutState>> = { ...fromLocal };
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
 * Save layout + hidden widgets for one breakpoint. Writes to both localStorage and DB.
 */
export async function saveLayout(
  orgId: string,
  userId: string,
  moduleKey: string,
  breakpoint: BreakpointKey,
  layout: LayoutItem[],
  hiddenWidgets: string[]
): Promise<{ error: Error | null }> {
  const existing = getLayoutFromLocalStorage(orgId, userId, moduleKey);
  setLayoutToLocalStorage(orgId, userId, moduleKey, {
    ...existing,
    [breakpoint]: { layout, hiddenWidgets },
  });
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

/** Returns true if two layout items overlap in grid space. */
function layoutItemsOverlap(a: LayoutItem, b: LayoutItem): boolean {
  if (a.i === b.i) return false;
  const aRight = a.x + a.w;
  const aBottom = a.y + a.h;
  const bRight = b.x + b.w;
  const bBottom = b.y + b.h;
  return a.x < bRight && aRight > b.x && a.y < bBottom && aBottom > b.y;
}

/** Returns true if any items in the layout overlap (would cause stacking). */
export function hasLayoutOverlaps(layout: LayoutItem[]): boolean {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      if (layoutItemsOverlap(layout[i], layout[j])) return true;
    }
  }
  return false;
}

/**
 * Merge saved layout with current widget definitions:
 * - Start from default layout for this breakpoint
 * - Apply saved positions/sizes for widgets that exist in definitions
 * - If saved layout has any overlapping items, use default layout so widgets are not stacked
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
  if (hasLayoutOverlaps(saved.layout)) return defaultLayout;

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

  const merged = Array.from(byId.values());
  if (hasLayoutOverlaps(merged)) return defaultLayout;
  return merged;
}
