import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSettingsPermissions } from '@/lib/auth/permission-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, UserPlus, Lock } from 'lucide-react';
import { checkSeatLimit } from '@/lib/org-limits';
import { updateMemberRole } from '@/actions/team';
import { TeamMembersTable } from './team-members-table';
import { InviteUserForm } from './invite-user-form';

export default async function SettingsTeamPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/settings/team';
  const permissions = await getSettingsPermissions(org.org_id, userId, pathname);
  const canViewUsers = permissions['settings.users.view'] ?? permissions['settings.users.manage'] ?? false;
  const canManageUsers = permissions['settings.users.manage'] ?? false;

  if (!canViewUsers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/app/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">You don&apos;t have access to this section</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Team management is restricted. Ask an owner or admin to grant you access or to make changes for you.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/app/settings">Back to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  const [seatCheck, { data: members }] = await Promise.all([
    checkSeatLimit(org.org_id),
    supabase
      .from('org_members')
      .select('id, user_id, role, status, created_at, profiles(full_name)')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false }),
  ]);

  const limit = seatCheck.limit ?? 5;
  const current = seatCheck.current ?? 0;
  const seatAllowed = seatCheck.allowed ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Invite users, assign roles, disable access, or send password reset</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite user
          </CardTitle>
          <CardDescription>Create an invite link for a new team member. They sign in or sign up and accept the link to join your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteUserForm seatAllowed={seatAllowed} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members
              </CardTitle>
              <CardDescription>
                {current} / {limit} seats used. Change roles, disable access, or send a password reset.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamMembersTable
            members={members ?? []}
            currentUserId={userId}
            updateMemberRole={updateMemberRole}
          />
        </CardContent>
      </Card>
    </div>
  );
}
