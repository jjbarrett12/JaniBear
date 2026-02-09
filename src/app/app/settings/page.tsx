import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { BrandingSettings } from '@/components/settings/branding-settings';
import { OrgSwitcher } from '@/components/settings/org-switcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Palette, Upload } from 'lucide-react';

export default async function SettingsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Get organization with branding data
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, primary_color, secondary_color, logo_url, custom_branding')
    .eq('id', org.org_id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your organization settings</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>
              Switch context to test Franchisor, Franchisee, or Independent experiences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrgSwitcher currentOrgId={org.org_id} />
          </CardContent>
        </Card>

        <BrandingSettings
          orgId={org.org_id}
          initialData={{
            primary_color: organization?.primary_color,
            secondary_color: organization?.secondary_color,
            logo_url: organization?.logo_url,
            custom_branding: organization?.custom_branding,
          }}
        />
      </div>
    </div>
  );
}
