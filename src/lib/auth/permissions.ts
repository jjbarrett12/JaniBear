/**
 * RBAC permission keys (v1) — single source of truth.
 * Server/DB enforce; UI hides by permission.
 */

export const PERMISSIONS = [
  'org.read',
  'org.update',
  'org.members.invite',
  'org.members.remove',
  'org.members.role.assign',
  'org.switch',
  'billing.read',
  'billing.update',
  'billing.cancel',
  'walkthrough.create',
  'walkthrough.read',
  'walkthrough.update',
  'walkthrough.delete',
  'proposal.generate',
  'proposal.read',
  'proposal.send',
  'contract.create',
  'contract.read',
  'inspection.create',
  'inspection.read',
  'inspection.update',
  'inspection.complete',
  'inspection.score.read',
  'task.read.assigned',
  'task.read.all',
  'task.assign',
  'task.complete',
  'task.proof.upload',
  'issue.create',
  'issue.read',
  'issue.assign',
  'issue.close',
  'dashboard.sales',
  'dashboard.ops',
  'dashboard.exec',
  'settings.branding',
  'settings.integrations',
  'settings.ai',
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];
