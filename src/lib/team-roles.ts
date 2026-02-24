/** Role values that can be assigned to org members (used by server actions and UI). */
export const ASSIGNABLE_ROLES = [
  'admin',
  'manager',
  'sales_rep',
  'sales',
  'ops',
  'inspector',
  'cleaner',
  'client_viewer',
] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];
