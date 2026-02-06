import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  Calendar, 
  ClipboardCheck, 
  AlertCircle,
  Users,
  FileUp,
  Calculator,
  Settings,
  TrendingUp,
  ListChecks,
  Building2,
  FileSearch,
  Package,
  GraduationCap,
  Ticket
} from 'lucide-react';

export async function AppSidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const org = await requireOrg();
  
  // Get organization branding and premium status for University
  const [organization, premium] = await Promise.all([
    supabase.from('organizations').select('logo_url').eq('id', org.org_id).single(),
    isPremiumPlan(org.org_id),
  ]);
  const { data: orgData } = organization ?? { data: null };
  
  const navItems = [
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/university', label: 'Jani-Bear University', icon: GraduationCap, premium: true },
    { href: '/app/crm/clients', label: 'Clients', icon: Building2 },
    { href: '/app/sales', label: 'Sales', icon: TrendingUp },
    { href: '/app/walkthroughs', label: 'Walkthroughs', icon: FileSearch },
    { href: '/app/supplies', label: 'Supplies', icon: Package },
    { href: '/app/locations', label: 'Locations', icon: MapPin },
    { href: '/app/crews', label: 'Crews', icon: Users },
    { href: '/app/templates', label: 'Templates', icon: FileText },
    { href: '/app/schedules', label: 'Schedules', icon: Calendar },
    { href: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/app/tasks', label: 'My Tasks', icon: ClipboardCheck },
    { href: '/app/issues', label: 'Issues', icon: AlertCircle },
    { href: '/app/tickets', label: 'Service Tickets', icon: Ticket },
    { href: '/app/bids', label: 'Bids & Estimates', icon: Calculator },
    { href: '/app/contracts', label: 'Contracts', icon: FileUp },
    { href: '/app/qc-assign', label: 'QC Task Assign', icon: ListChecks },
    { href: '/app/admin', label: 'Admin', icon: Settings },
    { href: '/app/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar logoUrl={orgData?.logo_url} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white dark:bg-gray-900 dark:border-gray-800">
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center border-b dark:border-gray-800 px-4">
            <Link href="/app/dashboard" className="flex items-center gap-3 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              {orgData?.logo_url ? (
                <Image
                  src={orgData.logo_url}
                  alt="Company Logo"
                  width={220}
                  height={80}
                  className="h-16 w-auto object-contain bg-transparent"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/janibear-logo.png"
                  alt="JANIBEAR Logo"
                  width={240}
                  height={80}
                  className="h-16 w-auto object-contain bg-transparent"
                  priority
                  unoptimized
                />
              )}
            </Link>
          </div>
          
          <div className="p-4 border-b dark:border-gray-800 space-y-3">
            <GlobalSearch />
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <DarkModeToggle />
              <NotificationBell />
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isPremiumItem = 'premium' in item && item.premium;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isPremiumItem && premium && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">Premium</Badge>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t dark:border-gray-800 p-4">
            {user && (
              <div className="mb-4 px-3 text-sm text-gray-600 dark:text-gray-400">
                {user.email}
              </div>
            )}
            <form action={handleSignOut}>
              <Button type="submit" variant="outline" className="w-full h-12 text-base">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
