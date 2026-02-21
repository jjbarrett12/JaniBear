import { createClient } from '@/lib/supabase/server';
import { PageHeader, KpiCard, KpiRow, ContentGrid, PrimaryPanel, ContextPanel } from '@/components/enterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, type OrgStatus } from '@/components/platform/status-pill';
import { Building2, Users, Activity, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function PlatformOverviewPage() {
  const supabase = await createClient();

  const [
    { count: totalOrgs } = { count: 0 },
    { data: orgs } = { data: [] },
    { count: totalUsers } = { count: 0 },
  ] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id, name, created_at').order('created_at', { ascending: false }).limit(10),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const orgList = (orgs ?? []) as { id: string; name: string; created_at: string }[];
  const activeOrgs = totalOrgs ?? 0;
  const trials = 0;
  const totalUsersCount = totalUsers ?? 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Platform health and top orgs by activity"
      />

      <KpiRow className="mb-8">
        <KpiCard title="Total Orgs" value={totalOrgs ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <KpiCard title="Active Orgs" value={activeOrgs} icon={<Building2 className="h-5 w-5" />} />
        <KpiCard title="Trials" value={trials} icon={<Clock className="h-5 w-5" />} />
        <KpiCard title="Total Users" value={totalUsersCount} icon={<Users className="h-5 w-5" />} />
        <KpiCard title="WAU" value="—" subtitle="Last 7 days" icon={<Activity className="h-5 w-5" />} />
        <KpiCard title="MAU" value="—" subtitle="Last 30 days" icon={<TrendingUp className="h-5 w-5" />} />
      </KpiRow>

      <ContentGrid
        primary={
          <PrimaryPanel>
            <Card className="rounded-2xl border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold tracking-tight">Top 10 Orgs (7d activity)</CardTitle>
              </CardHeader>
              <CardContent>
                {orgList.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No orgs yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Org</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Plan</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Last activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orgList.map((org) => (
                          <tr key={org.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-3 px-2">
                              <Link href={`/platform/orgs/${org.id}`} className="font-medium text-foreground hover:underline">
                                {org.name}
                              </Link>
                            </td>
                            <td className="py-3 px-2">
                              <StatusPill status={'active' as OrgStatus} />
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">—</td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </PrimaryPanel>
        }
        context={
          <ContextPanel>
            <Card className="rounded-2xl border border-border bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold tracking-tight">Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Errors (24h)</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Job failures</span>
                  <span className="font-medium">—</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">p95 latency</span>
                  <span className="font-medium">—</span>
                </div>
                <Link href="/platform/system-health" className="text-sm font-medium text-primary hover:underline">
                  System Health →
                </Link>
              </CardContent>
            </Card>
          </ContextPanel>
        }
      />
    </>
  );
}
