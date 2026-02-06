import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { AppSidebarNav } from '@/components/app/app-sidebar-nav';
import { AppSidebarFooter } from '@/components/app/app-sidebar-footer';

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
          
          <AppSidebarNav premium={premium} />

          <AppSidebarFooter userEmail={user?.email} signOutAction={handleSignOut} />
        </div>
      </aside>
    </>
  );
}
