/**
 * Persist widget collapsed state per user (and org/module) in localStorage.
 * Key: janibear_widget_collapsed_{orgId}_{userId}_{moduleKey}
 * Load on mount; save when toggling. Used by WidgetGrid + WidgetFrame.
 */

const PREFIX = 'janibear_widget_collapsed';

function storageKey(orgId: string, userId: string, moduleKey: string): string {
  return `${PREFIX}_${orgId}_${userId}_${moduleKey}`;
}

export function loadCollapsedWidgets(
  orgId: string,
  userId: string,
  moduleKey: string
): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(orgId, userId, moduleKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveCollapsedWidgets(
  orgId: string,
  userId: string,
  moduleKey: string,
  widgetIds: string[]
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(orgId, userId, moduleKey), JSON.stringify(widgetIds));
  } catch {
    /* ignore */
  }
}
