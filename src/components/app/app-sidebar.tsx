import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
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
  Settings
} from 'lucide-react';

export async function AppSidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const org = await requireOrg();
  
  // Get organization branding
  const { data: organization } = await supabase
    .from('organizations')
    .select('logo_url')
    .eq('id', org.org_id)
    .single();
  
  const navItems = [
    { href: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/app/locations', label: 'Locations', icon: MapPin },
    { href: '/app/crews', label: 'Crews', icon: Users },
    { href: '/app/templates', label: 'Templates', icon: FileText },
    { href: '/app/schedules', label: 'Schedules', icon: Calendar },
    { href: '/app/inspections', label: 'Inspections', icon: ClipboardCheck },
    { href: '/app/tasks', label: 'My Tasks', icon: ClipboardCheck },
    { href: '/app/issues', label: 'Issues', icon: AlertCircle },
    { href: '/app/bids', label: 'Bids & Estimates', icon: Calculator },
    { href: '/app/contracts', label: 'Contracts', icon: FileUp },
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
      <MobileSidebar logoUrl={organization?.logo_url} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/app/dashboard" className="flex items-center gap-3 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              {organization?.logo_url ? (
<Image
                src={organization.logo_url}
                alt="Company Logo"
                width={180}
                height={60}
                className="h-12 md:h-14 w-auto object-contain bg-transparent"
                priority
                unoptimized
              />
              ) : (
                <Image
                  src="/janibear-logo.png"
                  alt="Janibear Logo"
                  width={220}
                  height={72}
                  className="h-12 md:h-14 w-auto object-contain bg-transparent"
                  priority
                  unoptimized
                />
              )}
            </Link>
          </div>
          
          <div className="p-4 border-b space-y-3">
            <GlobalSearch />
            <div className="flex justify-end">
              <NotificationBell />
            </div>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors min-h-[48px]"
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t p-4">
            {user && (
              <div className="mb-4 px-3 text-sm text-gray-600">
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
