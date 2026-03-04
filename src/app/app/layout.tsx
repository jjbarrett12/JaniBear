import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { AppSidebar } from '@/components/app/app-sidebar';
import { AppMainWithHeader } from '@/components/app/app-main-with-header';
import { BottomNav } from '@/components/app/bottom-nav';
import { ShellGuard } from '@/components/app/shell-guard';
import { ThemeProvider } from '@/lib/theme-provider';
import { ThemeApplier } from '@/components/app/theme-applier';
import { createClient } from '@/lib/supabase/server';
import { getNavAlertCounts } from '@/actions/nav-alerts';
import { getImpersonateOrgId } from '@/actions/platform';
import { resolveShellForOrg, isFranchiseeEnrolled } from '@/lib/shell';
import { getProGearEnabled } from '@/lib/pro-gear-enabled';

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
  const impersonateOrgId = await getImpersonateOrgId();

  const [organizationResult, navAlerts, shell, franchiseeEnrolled, proGearEnabled] = await Promise.all([
    supabase.from('organizations').select('name, primary_color, secondary_color, logo_url').eq('id', org.org_id).maybeSingle(),
    getNavAlertCounts(),
    resolveShellForOrg(org.org_id),
    isFranchiseeEnrolled(org.org_id),
    getProGearEnabled(org.org_id),
  ]);

  // If branding columns don't exist yet (migration not run), fall back to name-only so login/dashboard still work
  let organizationData = organizationResult.data;
  if (organizationResult.error && /column|could not find/i.test(organizationResult.error.message ?? '')) {
    const fallback = await supabase.from('organizations').select('name').eq('id', org.org_id).maybeSingle();
    organizationData = fallback.data ?? null;
  }

  const orgName = organizationData?.name ?? (org.organizations as { name?: string } | null)?.name ?? null;
  const impersonatingOrgName = impersonateOrgId && impersonateOrgId === org.org_id ? orgName : null;

  const pathname = (await headers()).get('x-pathname') ?? '';
  if (shell === 'franchisor' && pathname.startsWith('/app/') && !pathname.startsWith('/app/franchise') && pathname !== '/app/settings' && !pathname.startsWith('/app/settings/') && pathname !== '/app/kpis' && !pathname.startsWith('/app/kpis/') && pathname !== '/app/kpi' && !pathname.startsWith('/app/kpi/') && pathname !== '/app/benchmarks' && !pathname.startsWith('/app/benchmarks/')) {
    redirect('/app/franchise');
  }

  // Users with onboarding_status = 'pending' can only access onboarding (safe: no row = no redirect)
  if (!pathname.startsWith('/app/onboarding')) {
    const { data: settings } = await supabase
      .from('org_settings')
      .select('onboarding_status')
      .eq('org_id', org.org_id)
      .maybeSingle();
    if (settings?.onboarding_status === 'pending') {
      redirect('/app/onboarding');
    }
  }

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organizationData ?? undefined}>
      <ThemeApplier />
      <ShellGuard shell={shell} />
      <div className="min-h-screen bg-background">
        <AppSidebar navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} proGearEnabled={proGearEnabled} />
        <AppMainWithHeader orgName={orgName} navAlerts={navAlerts} impersonatingOrgName={impersonatingOrgName}>
          {children}
        </AppMainWithHeader>
        <BottomNav navAlerts={navAlerts} shell={shell} />
      </div>
    </ThemeProvider>
  );
}
