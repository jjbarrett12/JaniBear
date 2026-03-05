/**
 * Canonical app and auth route builders. Use these instead of string literals
 * for dashboard navigation so hrefs stay consistent and avoid marketing layout flash.
 */

export const appRoutes = {
  dashboard: () => '/app/dashboard',
  executive: () => '/app/executive',
  financialHealth: () => '/app/financial-health',
  alerts: () => '/app/alerts',
  kpis: () => '/app/kpis',
  map: () => '/app/map',
  benchmarks: () => '/app/benchmarks',
  helphub: () => '/app/helphub',
  helphubSetup: () => '/app/helphub/setup',
  settings: () => '/app/settings',
  university: () => '/app/university',
  // Sales
  leads: () => '/app/sales/leads',
  lead: (id: string) => `/app/sales/leads/${id}`,
  accounts: () => '/app/sales/accounts',
  pipeline: () => '/app/sales/pipeline',
  walkthroughs: () => '/app/sales/walkthroughs',
  proposals: () => '/app/sales/proposals',
  scope: () => '/app/sales/scope',
  launchPackets: () => '/app/sales/launch-packets',
  // Ops
  opsLaunchIntake: () => '/app/ops/launch-intake',
  opsLaunches: () => '/app/ops/launches',
  opsAccounts: () => '/app/ops/accounts',
  sites: () => '/app/sites',
  site: (id: string) => `/app/sites/${id}`,
  crews: () => '/app/ops/crews',
  schedules: () => '/app/ops/schedules',
  inspections: () => '/app/inspections',
  inspectionsRun: () => '/app/inspections/run',
  inspectionsStart: () => '/app/inspections/start',
  inspection: (id: string) => `/app/inspections/${id}`,
  opsInspections: () => '/app/ops/inspections',
  qc: () => '/app/ops/qc',
  issuesSla: () => '/app/ops/issues-sla',
  issues: () => '/app/issues',
  issue: (id: string) => `/app/issues/${id}`,
  tasks: () => '/app/ops/tasks',
  supplies: () => '/app/ops/supplies',
  contracts: () => '/app/ops/contracts',
  tickets: () => '/app/tickets',
  ticket: (id: string) => `/app/tickets/${id}`,
  // Admin
  admin: () => '/app/admin',
  adminUsers: () => '/app/admin/users',
  adminInvites: () => '/app/admin/invites',
  adminAudit: () => '/app/admin/audit',
  adminSds: () => '/app/admin/sds',
  adminCompliance: () => '/app/admin/compliance',
  adminInvoices: () => '/app/admin/invoices',
  adminPurchaseOrders: () => '/app/admin/purchase-orders',
  adminEmployees: () => '/app/admin/employees',
  proGear: () => '/app/pro-gear',
  proGearCart: () => '/app/pro-gear/cart',
  // CRM
  crm: () => '/app/crm',
  crmClients: () => '/app/crm/clients',
  // Franchise
  franchise: () => '/app/franchise',
  // Billing (allowed when locked)
  billing: () => '/app/billing',
} as const;

/** Marketing routes (leave app; use next/link for client nav to avoid full reload). */
export const marketingRoutes = {
  pricing: () => '/pricing',
  demo: () => '/demo',
  contact: () => '/contact',
  home: () => '/',
} as const;

/** Auth routes. */
export const authRoutes = {
  login: () => '/auth/login',
  logout: () => '/auth/logout',
  signup: () => '/auth/signup',
  resetPassword: () => '/auth/reset-password',
} as const;
