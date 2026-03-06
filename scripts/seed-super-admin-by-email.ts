/**
 * Seed platform_admins with a user identified by email (super admin).
 * Uses Supabase Auth Admin API to resolve email -> user id, then inserts into platform_admins.
 *
 * Run: SUPER_ADMIN_EMAIL=user@example.com npx tsx scripts/seed-super-admin-by-email.ts
 *  or: npx tsx scripts/seed-super-admin-by-email.ts user@example.com
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const email = process.argv[2] ?? process.env.SUPER_ADMIN_EMAIL;

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!email || !email.includes('@')) {
  console.error('Usage: SUPER_ADMIN_EMAIL=user@example.com npx tsx scripts/seed-super-admin-by-email.ts');
  console.error('   or: npx tsx scripts/seed-super-admin-by-email.ts user@example.com');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error('User lookup failed:', error.message);
    process.exit(1);
  }
  const match = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  const userId = match?.id;
  if (!userId) {
    console.error('User not found for email:', email);
    process.exit(1);
  }
  const { error } = await supabase.from('platform_admins').upsert(
    { user_id: userId, note: 'Super admin (seeded by email)' },
    { onConflict: 'user_id' }
  );
  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }
  console.log('Seeded platform_admin for:', email, '(user_id:', userId, ')');
}

main();
