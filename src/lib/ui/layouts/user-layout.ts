/**
 * Fetch user's saved widget layout (My Layout). Re-exports from layoutPersistence and adds selectActiveLayout.
 */
import type { BreakpointKey, LayoutItem } from '@/lib/widgets/types';
import type { LayoutMode } from './types';
import type { ResolvedTemplates } from './templates';

export interface SavedLayoutState {
  layout: LayoutItem[];
  hiddenWidgets: string[];
}

/** Fetch user layout: same as fetchSavedLayout from layoutPersistence (client). For SSR use createClient from server and query user_widget_layouts. */
export { fetchSavedLayout as fetchUserLayout } from '@/lib/widgets/layoutPersistence';

/**
 * Select which layout to use based on mode. Does not mutate; returns the effective layout (and optional hiddenWidgets for 'my').
 * - my: use userLayout (caller must pass user's saved layout)
 * - recommended: use recommendedLayout (from system or org template by role)
 * - org_template: use orgTemplateLayout (org-specific template; fallback to recommended if none)
 */
export function selectActiveLayout(
  mode: LayoutMode,
  breakpoint: BreakpointKey,
  userLayout: SavedLayoutState | null,
  recommendedLayout: LayoutItem[] | null,
  orgTemplateLayout: LayoutItem[] | null
): { layout: LayoutItem[]; hiddenWidgets?: string[] } {
  if (mode === 'my' && userLayout?.layout?.length) {
    return { layout: userLayout.layout, hiddenWidgets: userLayout.hiddenWidgets };
  }
  if (mode === 'org_template' && orgTemplateLayout?.length) {
    return { layout: orgTemplateLayout };
  }
  if (recommendedLayout?.length) {
    return { layout: recommendedLayout };
  }
  return { layout: [] };
}

/**
 * Get recommended layout for a breakpoint from resolved templates (from fetchTemplates).
 */
export function getRecommendedLayoutForBreakpoint(
  templates: ResolvedTemplates,
  breakpoint: BreakpointKey
): LayoutItem[] | null {
  const entry = templates.byBreakpoint[breakpoint];
  return entry?.layout ?? null;
}

/**
 * Get org template layout for a breakpoint (only org rows, not system).
 */
export function getOrgTemplateLayoutForBreakpoint(
  templates: ResolvedTemplates,
  breakpoint: BreakpointKey
): LayoutItem[] | null {
  const orgRow = templates.orgRows.find((r) => r.breakpoint === breakpoint);
  return orgRow?.layout ?? null;
}
