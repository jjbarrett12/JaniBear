import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES = ['owner', 'admin', 'manager'];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
    .single();

  if (!member || !ADMIN_ROLES.includes(member.role ?? '')) {
    redirect('/app/dashboard');
  }

  return <>{children}</>;
}
