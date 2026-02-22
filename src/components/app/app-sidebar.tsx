import Image from 'next/image';
import { AppLink } from '@/components/app/app-link';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { isPremiumPlan } from '@/lib/is-premium';
import { getNavAlertCounts } from '@/actions/nav-alerts';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import type { ShellKey } from '@/lib/shell';
import { GlobalSearch } from '@/components/search/global-search';
import { MobileSidebar } from '@/components/app/mobile-sidebar';
import { BottomNav } from '@/components/app/bottom-nav';
import { AppSidebarNav } from '@/components/app/app-sidebar-nav';
import { AppSidebarFooter } from '@/components/app/app-sidebar-footer';

export async function AppSidebar({
  navAlerts: navAlertsProp,
  shell,
  franchiseeEnrolled,
}: { navAlerts?: NavAlertCounts | null; shell?: ShellKey; franchiseeEnrolled?: boolean } = {}) {
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
      <MobileSidebar logoUrl={orgData?.logo_url} navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} />

      {/* Desktop Sidebar - w-56 so it doesn't overlap main content */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-56 shrink-0 overflow-hidden border-r border-border bg-card">
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex flex-col shrink-0 border-b border-border px-3 py-4 bg-[hsl(220,30%,97%)] dark:bg-card">
            <AppLink href="/app/dashboard" className="flex min-h-[5.5rem] w-full min-w-0 items-center justify-center bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:!relative [&>span]:h-full [&>span]:w-full">
              {orgData?.logo_url ? (
                <Image
                  src={orgData.logo_url}
                  alt="Company Logo"
                  width={220}
                  height={96}
                  className="h-20 w-full max-h-20 object-contain object-center bg-transparent"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/logo.png"
                  alt="JANIBEAR Logo"
                  width={220}
                  height={96}
                  className="h-20 w-full max-h-20 object-contain object-center bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
                  priority
                  unoptimized
                />
              )}
            </AppLink>
          </div>
          
          <div className="min-w-0 shrink-0 border-b border-border px-3 py-2">
            <GlobalSearch />
          </div>
          
          <AppSidebarNav premium={premium} navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} />

          <AppSidebarFooter userEmail={user?.email} />
        </div>
      </aside>
    </>
  );
}
