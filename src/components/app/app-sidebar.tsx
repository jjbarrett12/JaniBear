import Image from 'next/image';
import { AppLink } from '@/components/app/app-link';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { getNavAlertCounts } from '@/actions/nav-alerts';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import { GlobalSearch } from '@/components/search/global-search';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { AppSidebarNav } from '@/components/app/app-sidebar-nav';
import { AppSidebarFooter } from '@/components/app/app-sidebar-footer';

export async function AppSidebar({ navAlerts: navAlertsProp }: { navAlerts?: NavAlertCounts | null } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const org = await requireOrg();

  const [organization, premium, navAlertsFetched] = await Promise.all([
    supabase.from('organizations').select('logo_url').eq('id', org.org_id).maybeSingle(),
    isPremiumPlan(org.org_id),
    navAlertsProp == null ? getNavAlertCounts() : Promise.resolve(navAlertsProp),
  ]);
  const orgData = organization?.data ?? null;
  const navAlerts = navAlertsFetched ?? navAlertsProp ?? null;
  
  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar logoUrl={orgData?.logo_url} navAlerts={navAlerts} />

      {/* Desktop Sidebar - w-56 so it doesn't overlap main content */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-56 shrink-0 overflow-hidden border-r border-border bg-card">
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex flex-col shrink-0 border-b border-border px-3 py-3 bg-[hsl(220,30%,97%)] dark:bg-card">
            <AppLink href="/app/dashboard" className="flex h-16 w-full min-w-0 items-center justify-center bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:!relative [&>span]:h-full [&>span]:w-full">
              {orgData?.logo_url ? (
                <Image
                  src={orgData.logo_url}
                  alt="Company Logo"
                  width={220}
                  height={72}
                  className="h-14 w-full max-h-14 object-contain object-center bg-transparent"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/logo.png"
                  alt="JANIBEAR Logo"
                  width={220}
                  height={72}
                  className="h-14 w-full max-h-14 object-contain object-center bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
                  priority
                  unoptimized
                />
              )}
            </AppLink>
          </div>
          
          <div className="min-w-0 shrink-0 space-y-2 border-b border-border px-3 py-2">
            <div className="min-w-0">
              <GlobalSearch />
            </div>
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <DarkModeToggle />
              <NotificationBell />
            </div>
          </div>
          
          <AppSidebarNav premium={premium} navAlerts={navAlerts} />

          <AppSidebarFooter userEmail={user?.email} />
        </div>
      </aside>
    </>
  );
}
