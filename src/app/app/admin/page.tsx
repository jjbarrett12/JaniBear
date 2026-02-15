import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
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
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';

// Demo counts for marketing screenshots (?demo=1)
const DEMO_COUNTS = { employees: 12, compliance: 8, sds: 24, po: 15, invoices: 42, phoneCalls: 6 };

const DEMO_ACTIVITY = [
  { label: 'New employee onboarded – Maria G.', time: '2 hours ago', icon: Users, color: 'text-blue-600' },
  { label: 'Compliance renewal submitted – OSHA 300', time: '5 hours ago', icon: CheckCircle2, color: 'text-green-600' },
  { label: 'Invoice #INV-1842 sent – Riverside Office Park', time: 'Yesterday', icon: Receipt, color: 'text-indigo-600' },
  { label: 'PO #4521 approved – Supplies order', time: 'Yesterday', icon: ShoppingCart, color: 'text-purple-600' },
  { label: 'SDS sheet updated – Multi-Surface Cleaner', time: '2 days ago', icon: FileText, color: 'text-amber-600' },
  { label: '3 phone calls handled by AI attendant', time: '2 days ago', icon: Phone, color: 'text-pink-600' },
];

export default async function AdminPage(props: { searchParams?: Promise<{ demo?: string }> | { demo?: string } }) {
  const searchParams = typeof props.searchParams === 'object' && props.searchParams !== null && 'then' in props.searchParams
    ? await props.searchParams
    : (props.searchParams ?? {});
  const isDemo = searchParams?.demo === '1';

  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();

  // Check if user is admin/owner
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
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

  const counts = isDemo ? DEMO_COUNTS : {
    employees: employeesCount.count || 0,
    compliance: complianceCount.count || 0,
    sds: sdsCount.count || 0,
    po: poCount.count || 0,
    invoices: invoiceCount.count || 0,
    phoneCalls: phoneCallsCount.count || 0,
  };

  const adminFeatures = [
    {
      title: 'Employees',
      description: 'Manage employees, roles, and permissions',
      href: '/app/admin/employees',
      icon: Users,
      count: counts.employees,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Compliance',
      description: 'Track compliance records and requirements',
      href: '/app/admin/compliance',
      icon: ClipboardCheck,
      count: counts.compliance,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'SDS Sheets',
      description: 'Manage Safety Data Sheets',
      href: '/app/admin/sds',
      icon: FileText,
      count: counts.sds,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      title: 'Purchase Orders',
      description: 'Manage supply orders and PO numbers',
      href: '/app/admin/purchase-orders',
      icon: ShoppingCart,
      count: counts.po,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Invoicing',
      description: 'Create and manage customer invoices',
      href: '/app/admin/invoices',
      icon: Receipt,
      count: counts.invoices,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Phone Attendant',
      description: 'Manage phone calls and AI-powered call handling',
      href: '/app/admin/phone',
      icon: Phone,
      count: counts.phoneCalls,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'AI Settings',
      description: 'Configure AI features and API keys',
      href: '/app/admin/ai-settings',
      icon: Settings,
      color: 'text-slate-600 dark:text-slate-300',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage employees, compliance, invoicing, and AI features</p>
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
                      <span className="text-2xl font-bold text-foreground">{feature.count}</span>
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
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Users className="h-5 w-5 mb-2 text-blue-600" />
              <div className="font-medium">Add Employee</div>
            </Link>
            <Link
              href="/app/admin/compliance/new"
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5 mb-2 text-green-600" />
              <div className="font-medium">New Compliance Record</div>
            </Link>
            <Link
              href="/app/admin/purchase-orders/new"
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 mb-2 text-purple-600" />
              <div className="font-medium">Create Purchase Order</div>
            </Link>
            <Link
              href="/app/admin/invoices/new"
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Receipt className="h-5 w-5 mb-2 text-indigo-600" />
              <div className="font-medium">Create Invoice</div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {isDemo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent activity
            </CardTitle>
            <CardDescription>Latest updates across admin</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {DEMO_ACTIVITY.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-start gap-3 py-2 border-b border-border last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
