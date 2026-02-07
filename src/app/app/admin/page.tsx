import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { 
  Users, 
  FileText, 
  ClipboardCheck, 
  ShoppingCart, 
  Receipt, 
  Phone,
  Settings,
  TrendingUp
} from 'lucide-react';

export default async function AdminPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  // Get quick stats
  const [employeesCount, complianceCount, sdsCount, poCount, invoiceCount, phoneCallsCount] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id),
    supabase.from('compliance_records').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id),
    supabase.from('sds_sheets').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id).eq('is_active', true),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id),
    supabase.from('phone_calls').select('id', { count: 'exact', head: true }).eq('org_id', org.org_id),
  ]);

  const adminFeatures = [
    {
      title: 'Employees',
      description: 'Manage employees, roles, and permissions',
      href: '/app/admin/employees',
      icon: Users,
      count: employeesCount.count || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Compliance',
      description: 'Track compliance records and requirements',
      href: '/app/admin/compliance',
      icon: ClipboardCheck,
      count: complianceCount.count || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'SDS Sheets',
      description: 'Manage Safety Data Sheets',
      href: '/app/admin/sds',
      icon: FileText,
      count: sdsCount.count || 0,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Purchase Orders',
      description: 'Manage supply orders and PO numbers',
      href: '/app/admin/purchase-orders',
      icon: ShoppingCart,
      count: poCount.count || 0,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Invoicing',
      description: 'Create and manage customer invoices',
      href: '/app/admin/invoices',
      icon: Receipt,
      count: invoiceCount.count || 0,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Phone Attendant',
      description: 'Manage phone calls and AI-powered call handling',
      href: '/app/admin/phone',
      icon: Phone,
      count: phoneCallsCount.count || 0,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'AI Settings',
      description: 'Configure AI features and API keys',
      href: '/app/admin/ai-settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage employees, compliance, invoicing, and AI features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${feature.bgColor}`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    {feature.count !== undefined && (
                      <span className="text-2xl font-bold text-gray-900">{feature.count}</span>
                    )}
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/app/admin/employees/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 mb-2 text-blue-600" />
              <div className="font-medium">Add Employee</div>
            </Link>
            <Link
              href="/app/admin/compliance/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5 mb-2 text-green-600" />
              <div className="font-medium">New Compliance Record</div>
            </Link>
            <Link
              href="/app/admin/purchase-orders/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mb-2 text-purple-600" />
              <div className="font-medium">Create Purchase Order</div>
            </Link>
            <Link
              href="/app/admin/invoices/new"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Receipt className="h-5 w-5 mb-2 text-indigo-600" />
              <div className="font-medium">Create Invoice</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
