import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  AlertCircle,
  Users,
  TrendingUp,
  Settings,
  Building2,
  FileSearch,
  BarChart3
} from 'lucide-react';
import { BrandName } from '@/components/ui/brand-name';

export async function AppSidebarNew() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const org = await requireOrg();
  
  const { data: organization } = await supabase
    .from('organizations')
    .select('logo_url')
    .eq('id', org.org_id)
    .single();
  
  const navItems = [
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/crm/clients', label: 'Clients', icon: Building2 },
    { href: '/app/sales', label: 'Sales / Opportunities', icon: TrendingUp },
    { href: '/app/walkthroughs', label: 'Walkthroughs', icon: FileSearch },
    { href: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/app/issues', label: 'Issues', icon: AlertCircle },
    { href: '/app/crews', label: 'Crews / Workload', icon: Users },
    { href: '/app/schedules', label: 'Schedule', icon: Calendar },
    { href: '/app/kpis', label: 'Reports / KPIs', icon: BarChart3 },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
  };

  return (
    <>
      <MobileSidebar logoUrl={organization?.logo_url} />

      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/app/dashboard" className="flex items-center gap-3">
              {organization?.logo_url ? (
                <Image
                  src={organization.logo_url}
                  alt="Company Logo"
                  width={180}
                  height={60}
                  className="h-12 w-auto object-contain"
                  priority
                  unoptimized
                />
              ) : (
                <BrandName variant="light" className="text-xl" />
              )}
            </Link>
          </div>
          
          <div className="p-4 border-b space-y-3">
            {/* <GlobalSearch /> */} 
            {/* Keeping search placeholder */}
            <div className="flex justify-end">
              <NotificationBell />
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t p-4">
            {user && (
              <div className="mb-4 px-3 text-sm text-gray-600 truncate">
                {user.email}
              </div>
            )}
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" className="w-full">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
