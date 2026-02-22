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

  const [organization, navAlerts, shell, franchiseeEnrolled] = await Promise.all([
    supabase.from('organizations').select('name, primary_color, secondary_color, logo_url, custom_branding').eq('id', org.org_id).maybeSingle(),
    getNavAlertCounts(),
    resolveShellForOrg(org.org_id),
    isFranchiseeEnrolled(org.org_id),
  ]);

  const orgName = organization?.data?.name ?? (org.organizations as { name?: string } | null)?.name ?? null;
  const impersonatingOrgName = impersonateOrgId && impersonateOrgId === org.org_id ? orgName : null;

  const pathname = (await headers()).get('x-pathname') ?? '';
  if (shell === 'franchisor' && pathname.startsWith('/app/') && !pathname.startsWith('/app/franchise') && pathname !== '/app/settings' && !pathname.startsWith('/app/settings/') && pathname !== '/app/kpis' && !pathname.startsWith('/app/kpis/')) {
    redirect('/app/franchise');
  }

  return (
    <ThemeProvider orgId={org.org_id} initialTheme={organization?.data ?? undefined}>
      <ThemeApplier />
      <ShellGuard shell={shell} />
      <div className="min-h-screen bg-background">
        <AppSidebar navAlerts={navAlerts} shell={shell} franchiseeEnrolled={franchiseeEnrolled} />
        <AppMainWithHeader orgName={orgName} navAlerts={navAlerts} impersonatingOrgName={impersonatingOrgName}>
          {children}
        </AppMainWithHeader>
        <BottomNav navAlerts={navAlerts} shell={shell} />
      </div>
    </ThemeProvider>
  );
}
