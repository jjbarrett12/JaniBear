#!/usr/bin/env node
/**
 * Audits dashboard sidebar routes: each should return 200 (OK) or 302/307 (redirect to login).
 * Run against a running dev/server or deployed URL.
 * Usage: BASE_URL=http://localhost:3001 node scripts/audit-sidebar-routes.mjs
 *
 * Routes are the canonical /app/* paths from nav factory (executive + sales + launch + ops + system).
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

const SIDEBAR_ROUTES = [
  '/app/executive',
  '/app/dashboard',
  '/app/financial-health',
  '/app/alerts',
  '/app/kpis',
  '/app/map',
  '/app/benchmarks',
  '/app/helphub',
  '/app/sales/leads',
  '/app/sales/accounts',
  '/app/crm/contacts',
  '/app/sales/pipeline',
  '/app/sales/walkthroughs',
  '/app/sales/proposals',
  '/app/ops/launch-intake',
  '/app/sales/launch-packets',
  '/app/sales/scope',
  '/app/ops/launches',
  '/app/ops/accounts',
  '/app/sites',
  '/app/ops/crews',
  '/app/ops/schedules',
  '/app/ops/inspections',
  '/app/ops/qc',
  '/app/ops/issues-sla',
  '/app/ops/tasks',
  '/app/ops/supplies',
  '/app/ops/contracts',
  '/app/admin',
  '/app/admin/users',
  '/app/admin/invites',
  '/app/admin/roles',
  '/app/admin/audit',
  '/app/admin/ai-settings',
  '/app/university',
  '/app/pro-gear',
  '/app/settings',
];

async function audit() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const path of SIDEBAR_ROUTES) {
    const url = `${BASE_URL.replace(/\/$/, '')}${path}`;
    try {
      const res = await fetch(url, { redirect: 'manual' });
      const ok = res.status === 200 || res.status === 302 || res.status === 307;
      if (ok) {
        passed++;
        console.log(`  ${res.status} ${path}`);
      } else {
        failed++;
        failures.push({ path, status: res.status });
        console.log(`  ${res.status} ${path} (expected 200 or 302/307)`);
      }
    } catch (err) {
      failed++;
      failures.push({ path, error: err.message });
      console.log(`  ERR ${path} ${err.message}`);
    }
  }

  console.log('');
  console.log(`Sidebar route audit: ${passed} passed, ${failed} failed (base: ${BASE_URL})`);
  if (failures.length > 0) {
    console.log('Failures:', JSON.stringify(failures, null, 2));
    process.exit(1);
  }
}

audit();
