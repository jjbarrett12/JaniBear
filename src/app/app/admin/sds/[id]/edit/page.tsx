import { redirect, notFound } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SDSForm } from '@/components/admin/sds-form';

export default async function EditSDSPage({
  params,
}: {
  params: { id: string };
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

  if (!member) {
    redirect('/app/dashboard');
  }
  if (!['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/admin');
  }

  const { data: sds } = await supabase
    .from('sds_sheets')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!sds) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Edit Safety Data Sheet</h1>
        <p className="text-gray-600 mt-2">Update SDS information</p>
      </div>
      <SDSForm sdsSheet={sds} />
    </div>
  );
}
