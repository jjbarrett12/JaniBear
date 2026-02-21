import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function PlatformUsersPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, org_id, role, status, organizations(name)')
    .order('org_id')
    .limit(200);

  const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">Search users and memberships (platform view)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Memberships
          </CardTitle>
          <CardDescription>Recent org_members across all orgs</CardDescription>
        </CardHeader>
        <CardContent>
          {!members?.length ? (
            <p className="text-muted-foreground">No memberships.</p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const org = m.organizations as { name?: string } | null;
                const profile = profileMap.get(m.user_id);
                return (
                  <li key={`${m.org_id}-${m.user_id}`} className="py-2 flex items-center gap-4 text-sm">
                    <span className="font-mono text-muted-foreground w-32 truncate">{m.user_id.slice(0, 8)}…</span>
                    <span className="w-40 truncate">{profile?.full_name ?? '—'}</span>
                    <span className="w-48 truncate">{org?.name ?? m.org_id}</span>
                    <span>{m.role}</span>
                    {m.status ? <span className="text-muted-foreground">({m.status})</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
