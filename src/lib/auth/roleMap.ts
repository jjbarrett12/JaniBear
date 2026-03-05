/**
 * Role → permissions map (v1). DB role_permissions is source of truth; this is for server-side checks.
 */
import type { RoleKey } from './roles';
import type { PermissionKey } from './permissions';
import { PERMISSIONS } from './permissions';

const ALL_PERMISSIONS: PermissionKey[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  'org.owner': ALL_PERMISSIONS,
  'org.admin': ALL_PERMISSIONS,
  'sales.manager': [
    'org.read',
    'walkthrough.create',
    'walkthrough.read',
    'walkthrough.update',
    'walkthrough.delete',
    'proposal.generate',
    'proposal.read',
    'proposal.send',
    'contract.create',
    'contract.read',
    'dashboard.sales',
  ],
  'sales.rep': [
    'org.read',
    'walkthrough.create',
    'walkthrough.read',
    'walkthrough.update',
    'proposal.generate',
    'proposal.read',
    'proposal.send',
    'contract.read',
    'dashboard.sales',
  ],
  'ops.manager': [
    'org.read',
    'inspection.create',
    'inspection.read',
    'inspection.update',
    'inspection.complete',
    'inspection.score.read',
    'task.read.all',
    'task.assign',
    'issue.create',
    'issue.read',
    'issue.assign',
    'issue.close',
    'dashboard.ops',
    'dashboard.exec',
  ],
  'ops.crew_lead': [
    'org.read',
    'task.read.all',
    'task.assign',
    'task.complete',
    'task.proof.upload',
    'issue.create',
    'issue.read',
    'issue.assign',
    'issue.close',
    'inspection.read',
    'inspection.complete',
    'dashboard.ops',
  ],
  'ops.crew': [
    'org.read',
    'task.read.assigned',
    'task.complete',
    'task.proof.upload',
    'issue.create',
    'issue.read',
  ],
  'client.viewer': [
    'org.read',
    'proposal.read',
    'inspection.score.read',
  ],
};
