/**
 * Stable E2E selectors and test user constants.
 * Use these for mission-critical tests to reduce flakiness and centralize changes.
 */

/** Test users from seed (scripts/seedTestOrg.ts). Password for all: Password123! */
export const TEST_USERS = {
  /** Alpha org owner — full access; use for tenant A and general flows */
  owner: 'owner@janibear.test',
  /** Alpha org admin — org management */
  admin: 'admin@janibear.test',
  /** Alpha — sales manager/rep; use for sales and launch flows */
  salesManager: 'salesmanager@janibear.test',
  salesRep: 'salesrep@janibear.test',
  /** Alpha — ops; use for operations and inspections */
  opsManager: 'opsmanager@janibear.test',
  crewLead: 'crewlead@janibear.test',
  crew: 'crew@janibear.test',
  /** Alpha — client viewer; read-only, no invite/admin */
  clientViewer: 'client@janibear.test',
  /** Bravo org owner — tenant B; use for tenant-isolation (user from A must not see B) */
  bravo: 'bravo@janibear.test',
} as const;

export const TEST_PASSWORD = 'Password123!';

/** Selectors by area. Prefer getByRole + name; fallback getByText for content. */
export const SELECTORS = {
  /** Login page */
  login: {
    emailInput: /email/i,
    passwordInput: /password/i,
    submitButton: /sign in|login/i,
  },
  /** App chrome */
  nav: {
    dashboard: /Dashboard/i,
    sales: /Sales/i,
    ops: /Operations|Ops/i,
    inspections: /Inspections/i,
    admin: /Admin/i,
    settings: /Settings/i,
    inviteOrAddUser: /invite|add user/i,
  },
  /** Forbidden / authz error pages */
  forbidden: {
    heading: /Access denied/i,
    body: /don't have permission/i,
    goToDashboard: /go to dashboard/i,
  },
  authzError: {
    heading: /couldn't verify access/i,
    retry: /retry/i,
    backToDashboard: /back to dashboard/i,
  },
  /** Sales */
  sales: {
    leadsHeading: /Leads|sales/i,
    leadsListOrEmpty: /Leads|My New Leads|No leads|Add lead/i,
    proposalsHeading: /Proposals|proposals|No proposals/i,
    walkthroughsHeading: /Walkthrough|Walkthroughs/i,
    launchPacketsHeading: /Launch to Operations|Launch packets|Draft|Ready|Submitted/i,
    pipelineHeading: /Pipeline/i,
  },
  /** Ops (Grizzly+) */
  ops: {
    upgradeScreen: /Grizzly|Operations|upgrade|Add to plan/i,
    crewsHeading: /Crews|crews|team/i,
    launchIntakeHeading: /Launch intake|Ready for launch/i,
  },
  /** Inspections */
  inspections: {
    heading: /Inspections|Quality checks|Recent Inspections/i,
    newInspectionButton: /New Inspection/i,
    startPageContent: /Start|New Inspection|Select|location|template/i,
    completeButton: /Complete Inspection/i,
  },
  /** Permission denied messaging */
  denied: /access denied|not allowed|don't have permission|couldn't verify/i,
} as const;

/** Default E2E login (from env or owner). */
export function getDefaultLogin(): { email: string; password: string } | null {
  const email = process.env.E2E_LOGIN_EMAIL;
  const password = process.env.E2E_LOGIN_PASSWORD;
  if (email && password) return { email, password };
  return null;
}

/** Skip when E2E credentials not set (use in test.beforeEach). */
export function skipWithoutE2ECredentials(): boolean {
  return !process.env.E2E_LOGIN_EMAIL || !process.env.E2E_LOGIN_PASSWORD;
}
