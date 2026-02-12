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

      {/* Desktop Sidebar - w-56 so it doesn't overlap main content */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-56 shrink-0 overflow-hidden border-r border-border bg-card">
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex h-20 shrink-0 items-center border-b border-border px-3">
            <Link href="/app/dashboard" className="flex min-w-0 items-center gap-2 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              {orgData?.logo_url ? (
                <Image
                  src={orgData.logo_url}
                  alt="Company Logo"
                  width={180}
                  height={64}
                  className="h-14 w-auto max-w-[200px] object-contain bg-transparent"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/transparent.png"
                  alt="JANIBEAR Logo"
                  width={180}
                  height={64}
                  className="h-14 w-auto max-w-[200px] object-contain bg-transparent [&>img]:bg-transparent"
                  priority
                  unoptimized
                />
              )}
            </Link>
          </div>
          
          <div className="min-w-0 shrink-0 space-y-3 border-b border-border p-3">
            <div className="min-w-0">
              <GlobalSearch />
            </div>
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
