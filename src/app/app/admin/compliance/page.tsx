import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, ClipboardCheck } from 'lucide-react';
import { ComplianceList } from '@/components/admin/compliance-list';

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; type?: string };
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

  if (!member) {
    redirect('/app/dashboard');
  }

  // Fetch compliance records
  let query = supabase
    .from('compliance_records')
    .select('*, locations(name), employees(first_name, last_name)')
    .eq('org_id', org.org_id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.type) {
    query = query.eq('type', searchParams.type);
  }

  if (searchParams.search) {
    query = query.or(
      `title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`
    );
  }

  const { data: records } = await query;

  // Get stats
  const { count: pendingCount } = await supabase
    .from('compliance_records')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'pending');

  const { count: compliantCount } = await supabase
    .from('compliance_records')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'compliant');

  const { count: nonCompliantCount } = await supabase
    .from('compliance_records')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', org.org_id)
    .eq('status', 'non_compliant');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance Management</h1>
          <p className="text-muted-foreground mt-2">Track compliance records and requirements</p>
        </div>
        <Link href="/app/admin/compliance/new">
          <Button size="lg" className="h-14 text-lg">
            <Plus className="h-5 w-5 mr-2" />
            New Compliance Record
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{compliantCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{nonCompliantCount || 0}</div>
          </CardContent>
        </Card>
      </div>

      <ComplianceList records={records || []} />
    </div>
  );
}
