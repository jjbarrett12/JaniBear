import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestDataActions } from '@/components/settings/test-data-actions';
import { Database, BarChart3, Users, MapPin, FileCheck, AlertCircle, Calendar, Building2 } from 'lucide-react';
import Link from 'next/link';

export default async function TestDataPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const orgId = org.org_id;

  const [
    locationsRes,
    leadsRes,
    accountsRes,
    inspectionsRes,
    issuesRes,
    crewsRes,
    schedulesRes,
  ] = await Promise.all([
    supabase.from('locations').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('issues').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('crews').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
  ]);

  const counts = {
    locations: locationsRes.count ?? 0,
    leads: leadsRes.count ?? 0,
    accounts: accountsRes.count ?? 0,
    inspections: inspectionsRes.count ?? 0,
    issues: issuesRes.count ?? 0,
    crews: crewsRes.count ?? 0,
    schedules: schedulesRes.count ?? 0,
  };

  const hasOpsData = counts.locations > 0 || counts.crews > 0;
  const hasSalesData = counts.leads > 0 || counts.accounts > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Test data</h1>
        <p className="text-muted-foreground mt-1">
          Add realistic sample data so you can click through modules and see what&apos;s broken. No data = nothing to test.
        </p>
      </div>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Database className="h-5 w-5" />
            Why use this
          </CardTitle>
          <CardDescription>
            Modules (Leads, Pipeline, Accounts, Sites, Inspections, Schedules, etc.) need data to be useful.
            Load sample data here, then go to each area and test: create a lead, convert to opportunity, open an inspection, assign a crew.
            If something errors or looks wrong, you&apos;ve found a real bug to fix.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Current counts
            </CardTitle>
            <CardDescription>What you have in this org right now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> Locations / Sites
              </span>
              <span className="font-medium">{counts.locations}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Leads
              </span>
              <span className="font-medium">{counts.leads}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" /> Accounts
              </span>
              <span className="font-medium">{counts.accounts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-4 w-4" /> Inspections
              </span>
              <span className="font-medium">{counts.inspections}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" /> Issues
              </span>
              <span className="font-medium">{counts.issues}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Crews
              </span>
              <span className="font-medium">{counts.crews}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Schedules
              </span>
              <span className="font-medium">{counts.schedules}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Load sample data</CardTitle>
            <CardDescription>
              Each button adds data only when that area is empty (e.g. no locations, or no leads). Safe to run once per org.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TestDataActions
              hasOpsData={hasOpsData}
              hasSalesData={hasSalesData}
              counts={counts}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Where to test after loading</CardTitle>
          <CardDescription>Click through these with sample data loaded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <Link href="/app/sales/leads" className="text-primary hover:underline font-medium">Leads</Link>
            {' '}— list, open a lead, convert to opportunity.
          </p>
          <p>
            <Link href="/app/sales/pipeline" className="text-primary hover:underline font-medium">Pipeline</Link>
            {' '}— opportunities by stage (if you convert leads).
          </p>
          <p>
            <Link href="/app/crm" className="text-primary hover:underline font-medium">CRM / Accounts</Link>
            {' '}— accounts list and detail.
          </p>
          <p>
            <Link href="/app/sites" className="text-primary hover:underline font-medium">Sites</Link>
            {' '}— locations; inspections and issues per site.
          </p>
          <p>
            <Link href="/app/inspections" className="text-primary hover:underline font-medium">Inspections</Link>
            {' '}— start and complete inspections.
          </p>
          <p>
            <Link href="/app/schedules" className="text-primary hover:underline font-medium">Schedules</Link>
            {' '}— assign crews and recurrence.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
