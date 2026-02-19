import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, Users, Key, ArrowLeft } from 'lucide-react';

export default async function PlatformAdminPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('is_platform_admin').eq('id', userId).single();
  if (!profile?.is_platform_admin) {
    redirect('/app/admin');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Admin</h1>
          <p className="text-muted-foreground mt-1">Tenant plans, add-ons, feature overrides, and user access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              <CardTitle>Tenants & plans</CardTitle>
            </div>
            <CardDescription>Set plan (Cub/Grizzly/Kodiak), toggle add-ons (HelpHub QR, LiDAR), override features</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use API routes or a future UI:</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>POST /api/admin/tenants/set-plan</li>
              <li>POST /api/admin/tenants/toggle-addon</li>
              <li>POST /api/admin/tenants/override-feature</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              <CardTitle>User access</CardTitle>
            </div>
            <CardDescription>Disable/enable membership, send password reset email, set password (superadmin)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use API routes or Settings → Team:</p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>POST /api/admin/users/disable</li>
              <li>POST /api/admin/users/enable</li>
              <li>POST /api/admin/users/reset-password</li>
              <li>POST /api/admin/users/set-password (platform admin only)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
