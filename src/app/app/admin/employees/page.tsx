import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Users, Search } from 'lucide-react';
import { EmployeeList } from '@/components/admin/employee-list';

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();

  // Check admin access
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  // Fetch employees
  let query = supabase
    .from('employees')
    .select('*')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,employee_number.ilike.%${searchParams.search}%`
    );
  }

  const { data: employees } = await query;

  // Get stats
  const { count: activeCount } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'active');

  const { count: totalCount } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-gray-600 mt-2">Manage your team members and their information</p>
        </div>
        <Link href="/app/admin/employees/new">
          <Button size="lg" className="h-14 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-400">
              {(totalCount || 0) - (activeCount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <EmployeeList employees={employees || []} />
    </div>
  );
}
