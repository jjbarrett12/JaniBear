/**
 * Fetch layout templates (org + system) for a module and role. SSR-safe: use from server or pass supabase client.
 */
import type { BreakpointKey, LayoutItem } from '@/lib/widgets/types';

export interface TemplateRow {
  org_id: string | null;
  module_key: string;
  role: string;
  breakpoint: string;
  layout: LayoutItem[];
  name?: string | null;
  is_locked?: boolean;
}

export interface ResolvedTemplates {
  /** Per breakpoint: org-specific template if any, else system template. */
  byBreakpoint: Partial<Record<BreakpointKey, { layout: LayoutItem[]; source: 'org' | 'system' }>>;
  orgRows: TemplateRow[];
  systemRows: TemplateRow[];
  /** From first org row: display name and lock state. */
  orgTemplateName?: string | null;
  orgTemplateLocked?: boolean;
}

/**
 * Fetch all templates for (orgId, moduleKey, role): org-specific first, then system.
 * Prefer org template for each breakpoint when present.
 * Pass createClient() from server or client (SSR-safe).
 */
export async function fetchTemplates(
  supabase: { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ data: TemplateRow[] | null }> }; is: (c: string, v: null) => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ data: TemplateRow[] | null }> } } } } } },
  orgId: string,
  moduleKey: string,
  role: string
): Promise<ResolvedTemplates> {
  const [orgRes, systemRes] = await Promise.all([
    supabase.from('widget_layout_templates').select('org_id, module_key, role, breakpoint, layout, name, is_locked').eq('org_id', orgId).eq('module_key', moduleKey).eq('role', role),
    supabase.from('widget_layout_templates').select('org_id, module_key, role, breakpoint, layout').is('org_id', null).eq('module_key', moduleKey).eq('role', role),
  ]);

  const orgRows = (orgRes.data ?? []) as TemplateRow[];
  const systemRows = (systemRes.data ?? []) as TemplateRow[];
  const firstOrg = orgRows[0];
  const orgTemplateName = firstOrg?.name ?? null;
  const orgTemplateLocked = Boolean(firstOrg?.is_locked);

  const byBreakpoint: ResolvedTemplates['byBreakpoint'] = {};
  const breakpoints: BreakpointKey[] = ['lg', 'md', 'sm'];

  for (const bp of breakpoints) {
    const orgRow = orgRows.find((r) => r.breakpoint === bp);
    const systemRow = systemRows.find((r) => r.breakpoint === bp);
    if (orgRow?.layout?.length) {
      byBreakpoint[bp] = { layout: orgRow.layout, source: 'org' };
    } else if (systemRow?.layout?.length) {
      byBreakpoint[bp] = { layout: systemRow.layout, source: 'system' };
    }
  }

  return { byBreakpoint, orgRows, systemRows, orgTemplateName, orgTemplateLocked };
}
