/**
 * Role-based dashboard layouts: templates, user layout, active mode.
 * SSR-safe: use createClient() from server or client when calling fetchTemplates / getActiveLayoutMode / setActiveLayoutMode.
 */
export type { LayoutMode, LayoutItem, BreakpointKey, TemplateRoleKey } from './types';
export { toTemplateRole, TEMPLATE_ROLES } from './types';
export { getRoleDisplayLabel, ROLE_DISPLAY_LABELS } from './role-labels';
export { fetchTemplates } from './templates';
export type { ResolvedTemplates, TemplateRow } from './templates';
export { getActiveLayoutMode, setActiveLayoutMode } from './active-mode';
export {
  fetchUserLayout,
  selectActiveLayout,
  getRecommendedLayoutForBreakpoint,
  getOrgTemplateLayoutForBreakpoint,
} from './user-layout';
export type { SavedLayoutState } from './user-layout';
