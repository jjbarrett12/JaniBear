/**
 * Seed 2 orgs + 7 test users (Alpha) + 1 user (Bravo) for RBAC E2E testing.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Run: npx tsx scripts/seedTestOrg.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const PASSWORD = 'Password123!';

const ALPHA_USERS = [
  { email: 'owner@janibear.test', role: 'org.owner' },
  { email: 'admin@janibear.test', role: 'org.admin' },
  { email: 'salesmanager@janibear.test', role: 'sales.manager' },
  { email: 'salesrep@janibear.test', role: 'sales.rep' },
  { email: 'opsmanager@janibear.test', role: 'ops.manager' },
  { email: 'crewlead@janibear.test', role: 'ops.crew_lead' },
  { email: 'crew@janibear.test', role: 'ops.crew' },
  { email: 'client@janibear.test', role: 'client.viewer' },
] as const;

async function main() {
  const userIds: Record<string, string> = {};
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 500 });
  const allUsers = listData?.users ?? [];

  for (const { email } of ALPHA_USERS) {
    const found = allUsers.find((u) => u.email === email);
    if (found) {
      userIds[email] = found.id;
      console.log('Exists:', email, found.id);
      continue;
    }
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) {
      if (/already|registered|exists/i.test(error.message)) {
        const { data: retryList } = await supabase.auth.admin.listUsers({ perPage: 500 });
        const retry = retryList?.users?.find((u) => u.email === email);
        if (retry) {
          userIds[email] = retry.id;
          console.log('Exists (from retry):', email, retry.id);
        }
      }
      if (!userIds[email]) console.error('Create user failed:', email, error.message);
      continue;
    }
    if (user?.user?.id) {
      userIds[email] = user.user.id;
      console.log('Created:', email, user.user.id);
    }
  }

  // Bravo user
  const bravoEmail = 'bravo@janibear.test';
  let bravoUserId: string;
  const { data: bravoList } = await supabase.auth.admin.listUsers();
  const bravoExisting = bravoList?.users?.find((u) => u.email === bravoEmail);
  if (bravoExisting) {
    bravoUserId = bravoExisting.id;
    console.log('Bravo exists:', bravoEmail);
  } else {
    const { data: bravoUser, error: bravoErr } = await supabase.auth.admin.createUser({
      email: bravoEmail,
      password: PASSWORD,
      email_confirm: true,
    });
    if (bravoErr || !bravoUser?.user?.id) {
      console.error('Bravo create failed:', bravoErr?.message);
      process.exit(1);
    }
    bravoUserId = bravoUser.user.id;
    console.log('Created Bravo:', bravoEmail);
  }

  // Orgs
  const { data: alphaOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Alpha Org')
    .maybeSingle();

  let alphaId: string;
  if (alphaOrg?.id) {
    alphaId = alphaOrg.id;
    console.log('Alpha Org exists:', alphaId);
  } else {
    const { data: inserted, error } = await supabase
      .from('organizations')
      .insert({ name: 'Alpha Org' })
      .select('id')
      .single();
    if (error || !inserted?.id) {
      console.error('Alpha org insert failed:', error?.message);
      process.exit(1);
    }
    alphaId = inserted.id;
    console.log('Created Alpha Org:', alphaId);
  }

  const { data: bravoOrg } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'Bravo Org')
    .maybeSingle();

  let bravoOrgId: string;
  if (bravoOrg?.id) {
    bravoOrgId = bravoOrg.id;
    console.log('Bravo Org exists:', bravoOrgId);
  } else {
    const { data: inserted, error } = await supabase
      .from('organizations')
      .insert({ name: 'Bravo Org' })
      .select('id')
      .single();
    if (error || !inserted?.id) {
      console.error('Bravo org insert failed:', error?.message);
      process.exit(1);
    }
    bravoOrgId = inserted.id;
    console.log('Created Bravo Org:', bravoOrgId);
  }

  // org_members for Alpha
  for (const { email, role } of ALPHA_USERS) {
    const uid = userIds[email];
    if (!uid) continue;
    const { error } = await supabase.from('org_members').upsert(
      { org_id: alphaId, user_id: uid, role, status: 'active' },
      { onConflict: 'org_id,user_id' }
    );
    if (error) console.error('Member upsert failed:', email, error.message);
    else console.log('Member:', email, role);
  }

  // Bravo member
  const { error: bravoMemErr } = await supabase.from('org_members').upsert(
    { org_id: bravoOrgId, user_id: bravoUserId, role: 'org.owner', status: 'active' },
    { onConflict: 'org_id,user_id' }
  );
  if (bravoMemErr) console.error('Bravo member failed:', bravoMemErr.message);
  else console.log('Bravo member:', bravoEmail, 'org.owner');

  // org_features for Alpha
  await supabase.from('org_features').upsert(
    [
      { org_id: alphaId, feature_key: 'addon.ai_proposals', enabled: true },
      { org_id: alphaId, feature_key: 'addon.lidar', enabled: false },
      { org_id: alphaId, feature_key: 'addon.helphubqr', enabled: false },
    ],
    { onConflict: 'org_id,feature_key' }
  );
  console.log('Alpha org_features set');

  const idsPath = process.env.E2E_IDS_PATH || '.e2e-ids.json';
  const fs = await import('fs');
  fs.writeFileSync(
    idsPath,
    JSON.stringify({ alphaOrgId: alphaId, bravoOrgId: bravoOrgId }, null, 2)
  );
  console.log('Wrote', idsPath, 'with alphaOrgId and bravoOrgId');
  console.log('Done. Passwords:', PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
