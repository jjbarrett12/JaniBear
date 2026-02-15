import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';

export default async function PhoneAttendantPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org.org_id)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (!member || !['owner', 'admin', 'manager'].includes(member.role)) {
    redirect('/app/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Phone Attendant</h1>
        <p className="text-muted-foreground mt-1">Manage phone calls and AI-powered call handling</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Phone Attendant
          </CardTitle>
          <CardDescription>View and manage phone calls handled by the AI attendant.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This section is being built. Check back later for call logs and settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}
