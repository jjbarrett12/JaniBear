import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getIsPlatformAdmin } from '@/lib/platform-guard';
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
import { ServiceWorkerRegister } from '@/components/app/ServiceWorkerRegister';
import { getOrganizationTrialState } from '@/lib/trial/getOrganizationTrialState';
import { enforceTrialExpiration } from '@/lib/trial/enforceTrialExpiration';

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

  const pathname = (await headers()).get('x-pathname') ?? '';

  const [organizationResult, orgSettingsResult, navAlerts, shell, franchiseeEnrolled, proGearEnabled] = await Promise.all([
    supabase.from('organizations').select('name, primary_color, secondary_color, logo_url, slug, billing_status, past_due_since, locked_since, trial_started_at, trial_ends_at, trial_mode').eq('id', org.org_id).maybeSingle(),
    supabase.from('org_settings').select('display_name, logo_url, primary_color, accent_color').eq('org_id', org.org_id).maybeSingle(),
    getNavAlertCounts(),
    resolveShellForOrg(org.org_id),
    isFranchiseeEnrolled(org.org_id),
    getProGearEnabled(org.org_id),
  ]);

  await enforceTrialExpiration(supabase, org.org_id);
  const trialState = await getOrganizationTrialState(supabase, org.org_id);

  const billing = organizationResult.data;
  const billingLocked =
    billing?.billing_status === 'canceled' ||
    (billing?.billing_status === 'past_due' && !!billing?.locked_since);
  const allowedWhenLocked =
    pathname === '/app/billing' ||
    pathname.startsWith('/app/upgrade') ||
    pathname.startsWith('/app/onboarding') ||
    pathname.startsWith('/app/onboarding/') ||
    pathname.startsWith('/app/settings');
  const userId = await getCurrentUserId();
  const isSuperAdmin = userId ? await getIsPlatformAdmin(userId) : false;
  if (billingLocked && !allowedWhenLocked && !isSuperAdmin) {
    redirect('/app/billing');
  }

  // If branding columns don't exist yet (migration not run), fall back to name-only so login/dashboard still work
  let organizationData = organizationResult.data;
  if (organizationResult.error && /column|could not find/i.test(organizationResult.error.message ?? '')) {
    const fallback = await supabase.from('organizations').select('name').eq('id', org.org_id).maybeSingle();
    organizationData = fallback.data ?? null;
  }

  const settings = orgSettingsResult.data;
  const orgName =
    (settings?.display_name && settings.display_name.trim()) ? settings.display_name.trim()
    : organizationData?.name ?? (org.organizations as { name?: string } | null)?.name ?? null;
  const orgLogoUrl = (settings?.logo_url && settings.logo_url.trim()) ? settings.logo_url : organizationData?.logo_url ?? null;
  const orgPrimaryColor = (settings?.primary_color && settings.primary_color.trim()) ? settings.primary_color : organizationData?.primary_color ?? null;
  const orgSecondaryColor = (settings?.accent_color && settings.accent_color.trim()) ? settings.accent_color : organizationData?.secondary_color ?? null;
  const workspaceTheme = organizationData
    ? { ...organizationData, name: orgName, logo_url: orgLogoUrl, primary_color: orgPrimaryColor, secondary_color: orgSecondaryColor }
    : organizationData;
  const impersonatingOrgName = impersonateOrgId && impersonateOrgId === org.org_id ? orgName : null;

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
    <ThemeProvider orgId={org.org_id} initialTheme={workspaceTheme ?? undefined}>
      <ServiceWorkerRegister />
      <ThemeApplier />
      <ShellGuard shell={shell} />
      <div className="min-h-screen bg-background">
        <AppSidebar navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} proGearEnabled={proGearEnabled} />
        <AppMainWithHeader orgName={orgName} navAlerts={navAlerts} impersonatingOrgName={impersonatingOrgName} trialState={trialState}>
          {children}
        </AppMainWithHeader>
        <BottomNav navAlerts={navAlerts} shell={shell} />
      </div>
    </ThemeProvider>
  );
}
