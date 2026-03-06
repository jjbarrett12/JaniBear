import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getSettingsPermissions } from '@/lib/auth/permission-helpers';
import { BrandingSettings } from '@/components/settings/branding-settings';
import { BenchmarkingSettings } from '@/components/settings/benchmarking-settings';
import { ProfilePhotoSettings } from '@/components/settings/profile-photo-settings';
import { OrgSwitcher } from '@/components/settings/org-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Settings, Palette, Upload, Users, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function SettingsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/settings';
  const permissions = await getSettingsPermissions(org.org_id, userId, pathname);
  const supabase = await createClient();
  const canManageBenchmarking = permissions['settings.org.edit'] ?? false;

  // Get organization with branding data (.maybeSingle() so RLS/empty doesn't throw)
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, primary_color, secondary_color, logo_url')
    .eq('id', org.org_id)
    .maybeSingle();

  const canViewOrg = permissions['settings.org.view'] ?? permissions['settings.org.edit'] ?? false;
  const canViewUsers = permissions['settings.users.view'] ?? permissions['settings.users.manage'] ?? false;
  const canViewBilling = permissions['settings.billing.view'] ?? permissions['settings.billing.manage'] ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organization settings</p>
      </div>

      <div className="space-y-6">
        {(permissions['settings.view'] ?? permissions['settings.profile.edit']) && <ProfilePhotoSettings />}
        {(permissions['settings.org.view'] ?? permissions['settings.org.edit'] ?? false) && (
        <BrandingSettings
          orgId={org.org_id}
          initialData={{
            primary_color: organization?.primary_color,
            secondary_color: organization?.secondary_color,
            logo_url: organization?.logo_url,
          }}
        />
        )}
        {canManageBenchmarking && <BenchmarkingSettings orgId={org.org_id} />}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Test data
            </CardTitle>
            <CardDescription>
              Add sample leads, customers, locations, and more so you can test modules and see what&apos;s broken. No data = nothing to test.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/settings/test-data">
              <Button variant="secondary">Open Test data</Button>
            </Link>
          </CardContent>
        </Card>
        {canViewUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team
            </CardTitle>
            <CardDescription>Invite users, assign roles, disable access, send password reset</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/settings/team">
              <Button variant="secondary">Manage team</Button>
            </Link>
          </CardContent>
        </Card>
        )}
        {(canManageBenchmarking ?? false) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Control Center
              </CardTitle>
              <CardDescription>Control AI features, automation rules, privacy, and spending</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/app/settings/ai"
                className={cn(buttonVariants({ variant: 'secondary' }))}
              >
                Open AI Control Center
              </Link>
            </CardContent>
          </Card>
        )}
        {canViewOrg && (
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Switch context to test Franchisor, Franchisee, or Independent experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OrgSwitcher currentOrgId={org.org_id} />
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm">How to test different org types</h4>
              <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <li>In Supabase Dashboard go to <strong>Authentication → Users</strong>, open your user, and copy your <strong>User UUID</strong>.</li>
                <li>Open <code className="rounded bg-black/10 dark:bg-white/10 px-1">supabase/scripts/testing_org_types.sql</code> in this repo, replace both <code className="rounded bg-black/10 dark:bg-white/10 px-1">YOUR_USER_ID</code> with your UUID, then paste and run it in Supabase <strong>SQL Editor</strong>.</li>
                <li>Come back here and refresh. Use the <strong>Active organization</strong> dropdown above to switch between <strong>Test Franchisor</strong>, <strong>Test Franchisee</strong>, and <strong>Test Independent</strong>.</li>
                <li>After switching, the app reloads and shows that org type (Franchisor: standards/outcomes; Franchisee/Independent: full operations).</li>
              </ol>
              <p className="text-xs text-gray-600 dark:text-gray-400 pt-1">
                SQL: <code className="rounded bg-black/10 dark:bg-white/10 px-1">supabase/scripts/testing_org_types.sql</code> · Steps: <code className="rounded bg-black/10 dark:bg-white/10 px-1">TESTING_ORG_TYPES.md</code>
              </p>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
