import { redirect, notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SDSForm } from '@/components/admin/sds-form';

export default async function EditSDSPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member) {
    redirect('/app/dashboard');
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
        <h1 className="text-3xl font-bold">Edit Safety Data Sheet</h1>
        <p className="text-gray-600 mt-2">Update SDS information</p>
      </div>
      <SDSForm sdsSheet={sds} />
    </div>
  );
}
