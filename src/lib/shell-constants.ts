/**
 * Shell = dashboard experience. Constants and types only (no server imports).
 * Safe to import from client components. Server-only logic lives in shell.ts.
 */
export type ShellKey = 'owner_operator' | 'franchisee' | 'franchisor';

export const SHELL_LABELS: Record<ShellKey, string> = {
  owner_operator: 'Owner/Operator (Independent Cleaning Company)',
  franchisee: 'Franchisee (Unit Operator — receives Network Opportunities)',
  franchisor: 'Franchisor (Brand HQ — Placement Board)',
};
