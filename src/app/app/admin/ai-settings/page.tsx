import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default async function AISettingsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', userId)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Settings</h1>
        <p className="text-muted-foreground mt-1">Configure AI features and API keys</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Settings
          </CardTitle>
          <CardDescription>Manage API keys and options for AI-powered features (compliance, invoices, scheduling, etc.).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is being built. Check back later to configure AI options.</p>
        </CardContent>
      </Card>
    </div>
  );
}
