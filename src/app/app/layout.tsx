import { requireOrg } from '@/lib/auth';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppMainWithHeader } from '@/components/app/app-main-with-header';
import { BottomNav } from '@/components/app/bottom-nav';
import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeApplier } from '@/components/app/theme-applier';
import { createClient } from '@/lib/supabase/server';
import { getNavAlertCounts } from '@/actions/nav-alerts';

// Ensure layout always runs with current request (cookies) on client-side navigation
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const [organization, navAlerts] = await Promise.all([
    supabase.from('organizations').select('name, primary_color, secondary_color, logo_url, custom_branding').eq('id', org.org_id).maybeSingle(),
    getNavAlertCounts(),
  ]);

  const orgName = organization?.data?.name ?? null;

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organization?.data ?? undefined}>
      <ThemeApplier />
      <div className="min-h-screen bg-background">
        <AppSidebar navAlerts={navAlerts} />
        <AppMainWithHeader orgName={orgName} navAlerts={navAlerts}>
          {children}
        </AppMainWithHeader>
        <BottomNav navAlerts={navAlerts} />
      </div>
    </ThemeProvider>
  );
}
