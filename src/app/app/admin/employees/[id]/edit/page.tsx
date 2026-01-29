import { redirect, notFound } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EmployeeForm } from '@/components/admin/employee-form';

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  // Check admin access
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  // Fetch employee
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Employee</h1>
        <p className="text-gray-600 mt-2">Update employee information</p>
      </div>
      <EmployeeForm employee={employee} />
    </div>
  );
}
