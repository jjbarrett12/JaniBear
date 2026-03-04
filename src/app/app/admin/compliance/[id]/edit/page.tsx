import { redirect, notFound } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ComplianceForm } from '@/components/admin/compliance-form';

export default async function EditCompliancePage({
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

  const { data: compliance } = await supabase
    .from('compliance_records')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!compliance) {
    notFound();
  }

  const [locationsResult, employeesResult] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', org.org_id).order('name'),
    supabase.from('employees').select('id, first_name, last_name').eq('org_id', org.org_id).eq('status', 'active').order('first_name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Compliance Record</h1>
        <p className="text-gray-600 mt-2">Update compliance information</p>
      </div>
      <ComplianceForm
        compliance={compliance}
        locations={locationsResult.data || []}
        employees={employeesResult.data || []}
      />
    </div>
  );
}
