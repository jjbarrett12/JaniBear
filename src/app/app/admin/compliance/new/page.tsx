import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ComplianceForm } from '@/components/admin/compliance-form';

export default async function NewCompliancePage() {
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

  const [locationsResult, employeesResult] = await Promise.all([
    supabase.from('locations').select('id, name').eq('org_id', org.org_id).order('name'),
    supabase.from('employees').select('id, first_name, last_name').eq('org_id', org.org_id).eq('status', 'active').order('first_name'),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Compliance Record</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Create a compliance requirement or tracking record</p>
      </div>
      <ComplianceForm
        locations={locationsResult.data || []}
        employees={employeesResult.data || []}
      />
    </div>
  );
}
