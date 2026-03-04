/**
 * Nav: shell → org_type mapping and factory invocation.
 * Sidebar built from org_type, role, and feature flags (see navFactory.ts).
 * "Sites" → "Accounts" in UI; "Locations" only within Account context.
 */
import type { ShellKey } from '@/lib/shell';
import type { NavSection } from '@/lib/nav/navFactory';
import { buildNavSections } from '@/lib/nav/navFactory';

export type { NavItem, NavSection, NavGroup } from '@/lib/nav/navFactory';

function shellToOrgType(shell: ShellKey): 'independent' | 'franchisee' | 'franchisor' {
  switch (shell) {
    case 'owner_operator':
      return 'independent';
    case 'franchisee':
      return 'franchisee';
    case 'franchisor':
      return 'franchisor';
    default:
      return 'independent';
  }
}

/**
 * Return nav sections for the given shell. Uses navigation factory (Sales, Ops, Launch Intake, Accounts).
 */
export function getNavSectionsForShell(
  shell: ShellKey,
  franchiseeEnrolled: boolean
): NavSection[] {
  return buildNavSections({
    orgType: shellToOrgType(shell),
    franchiseeEnrolled,
    featureFlags: { approvals_enabled: false },
  });
}
