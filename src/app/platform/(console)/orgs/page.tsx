import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/enterprise';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill, type OrgStatus } from '@/components/platform/status-pill';
import { Plus } from 'lucide-react';

export default async function PlatformOrgsPage() {
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, created_at, org_type')
    .order('created_at', { ascending: false });

  const list = (orgs ?? []) as { id: string; name: string; created_at: string; org_type: string }[];

  return (
    <>
      <PageHeader
        title="Orgs"
        description="All organizations on the platform"
        actions={
          <Button asChild>
            <Link href="/platform/orgs/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Org
            </Link>
          </Button>
        }
      />

      <Card className="rounded-2xl border border-border bg-card shadow-sm mt-6">
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No orgs yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Org</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Users</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last activity</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Created</th>
                    <th className="w-0 py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((org) => (
                    <tr key={org.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4">
                        <Link href={`/platform/orgs/${org.id}`} className="font-medium text-foreground hover:underline">
                          {org.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <StatusPill status={'active' as OrgStatus} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">—</td>
                      <td className="py-3 px-4 text-muted-foreground">—</td>
                      <td className="py-3 px-4 text-muted-foreground">—</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/platform/orgs/${org.id}`} className="text-xs font-medium text-primary hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
