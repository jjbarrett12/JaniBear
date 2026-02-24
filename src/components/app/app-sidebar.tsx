import Image from 'next/image';
import { AppLink } from '@/components/app/app-link';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { isPremiumPlan, getPlanType } from '@/lib/is-premium';
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
  proGearEnabled = false,
}: { navAlerts?: NavAlertCounts | null; shell?: ShellKey; franchiseeEnrolled?: boolean; proGearEnabled?: boolean } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const org = await requireOrg();

  const [organizationResult, premium, planType, navAlertsFetched] = await Promise.all([
    supabase.from('organizations').select('logo_url').eq('id', org.org_id).maybeSingle(),
    isPremiumPlan(org.org_id),
    getPlanType(org.org_id),
    navAlertsProp == null ? getNavAlertCounts() : Promise.resolve(navAlertsProp),
  ]);
  // If logo_url column doesn't exist yet (migration not run), treat as no custom logo
  const orgData = organizationResult.error && /column|could not find/i.test(organizationResult.error.message ?? '')
    ? null
    : (organizationResult.data ?? null);
  const navAlerts = navAlertsFetched ?? navAlertsProp ?? null;
  const operationsLocked = !premium;

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar logoUrl={orgData?.logo_url} navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} proGearEnabled={proGearEnabled} operationsLocked={operationsLocked} />

      {/* Desktop Sidebar - w-56 so it doesn't overlap main content; uses brand primary for color */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-56 shrink-0 overflow-hidden border-r-2 border-primary bg-primary/15 dark:bg-primary/20">
        <div className="flex h-full min-w-0 flex-1 flex-col">
          {/* Logo box: single clean block, centered logo */}
          <div className="flex shrink-0 border-b border-primary/30 bg-primary/20 dark:bg-primary/25 min-h-[5.5rem] flex items-center justify-center px-4 py-3">
            <AppLink href="/app/dashboard" className="flex items-center justify-center min-h-[4rem] w-full bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:!relative [&>span]:h-[4rem] [&>span]:w-full [&>span]:max-w-[180px]">
              {orgData?.logo_url ? (
                <Image
                  src={orgData.logo_url}
                  alt="Company Logo"
                  width={180}
                  height={64}
                  className="h-16 w-full max-h-16 object-contain object-center bg-transparent"
                  priority
                  unoptimized
                />
              ) : (
                <Image
                  src="/logo.png"
                  alt="JANIBEAR Logo"
                  width={180}
                  height={64}
                  className="h-16 w-full max-h-16 object-contain object-center bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
                  priority
                  unoptimized
                />
              )}
            </AppLink>
          </div>
          
          <div className="min-w-0 shrink-0 border-b border-border px-3 py-2">
            <GlobalSearch />
          </div>
          
          <AppSidebarNav premium={premium} planType={planType} navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} proGearEnabled={proGearEnabled} operationsLocked={operationsLocked} />

          <AppSidebarFooter userEmail={user?.email} />
        </div>
      </aside>
    </>
  );
}
