/**
 * Seed platform_admins with Jason (single platform owner).
 * Run after migration 051: npx tsx scripts/seed-platform-admin.ts
 * Requires: JASON_USER_ID env (UUID of Jason's auth.users.id) or pass as first arg.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jasonUserId = process.argv[2] ?? process.env.JASON_USER_ID;

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!jasonUserId) {
  console.error('Usage: JASON_USER_ID=<uuid> npx tsx scripts/seed-platform-admin.ts');
  console.error('   or: npx tsx scripts/seed-platform-admin.ts <uuid>');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const { error } = await supabase.from('platform_admins').upsert(
    { user_id: jasonUserId, note: 'Platform owner (Jason)' },
    { onConflict: 'user_id' }
  );
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log('Inserted platform_admin for user:', jasonUserId);
}

main();
