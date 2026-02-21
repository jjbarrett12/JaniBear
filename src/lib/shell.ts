/**
 * Shell = dashboard experience. Single source of truth from organizations.shell.
 * Do not infer shell from org_type, membership, or anything else.
 */
import { createClient } from '@/lib/supabase/server';

export type ShellKey = 'owner_operator' | 'franchisee' | 'franchisor';

const DEFAULT_SHELL: ShellKey = 'owner_operator';

/**
 * Resolve the shell for an org. Used by app shell, nav, and route guards.
 */
export async function resolveShellForOrg(orgId: string): Promise<ShellKey> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('shell')
    .eq('id', orgId)
    .maybeSingle();

  const value = data?.shell as ShellKey | null | undefined;
  if (value === 'owner_operator' || value === 'franchisee' || value === 'franchisor') {
    return value;
  }
  return DEFAULT_SHELL;
}

/**
 * Franchisee is enrolled when they have an active franchise_associations row (franchisee_org_id = current org).
 */
export async function isFranchiseeEnrolled(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('franchise_associations')
    .select('id')
    .eq('franchisee_org_id', orgId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  return !!data;
}

export const SHELL_LABELS: Record<ShellKey, string> = {
  owner_operator: 'Owner/Operator (Independent Cleaning Company)',
  franchisee: 'Franchisee (Unit Operator — receives Network Opportunities)',
  franchisor: 'Franchisor (Brand HQ — Placement Board)',
};
