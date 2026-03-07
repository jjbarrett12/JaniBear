import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Rocket, CheckCircle2, XCircle } from 'lucide-react';
import { getLaunchPlanByLocation } from '@/actions/launch-plan';
import { SiteDetailTabs } from '@/components/crm/site-detail-tabs';

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: locationId } = await params;
  const { tab } = await searchParams;
  const org = await requireOrg();
  const supabase = await createClient();

  let location = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .eq('org_id', org.org_id)
    .single()
    .then((r) => r.data);

  if (!location) {
    const facility = await supabase
      .from('facilities')
      .select('*')
      .eq('id', locationId)
      .eq('org_id', org.org_id)
      .single()
      .then((r) => r.data);
    if (facility) {
      location = {
        ...facility,
        client_id: (facility as { account_id?: string | null }).account_id ?? null,
      } as typeof location;
    }
  }

  if (!location) notFound();

  const clientId = (location as { client_id?: string | null }).client_id;
  const [client, contacts, walkthroughs, bids, crewAssignments, schedules, inspections, issues] = await Promise.all([
    clientId
      ? supabase.from('clients').select('id, name').eq('id', clientId).eq('org_id', org.org_id).single()
      : { data: null },
    supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, email, phone, contact_type')
      .eq('org_id', org.org_id)
      .or(clientId ? `location_id.eq.${locationId},client_id.eq.${clientId}` : `location_id.eq.${locationId}`)
      .order('last_name'),
    supabase
      .from('walkthroughs')
      .select('id, status, scheduled_at, opportunity_id, opportunities(stage)')
      .eq('org_id', org.org_id)
      .eq('location_id', locationId)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('bids')
      .select('id, status, total_estimated_cost, opportunity_id, created_at')
      .eq('org_id', org.org_id)
      .eq('location_id', locationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('crew_assignments')
      .select('id, crew_id, start_date, end_date, is_active, crews(name)')
      .eq('org_id', org.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
      .order('start_date', { ascending: false }),
    supabase
      .from('schedules')
      .select('id, template_id, crew_id, start_date, recurrence, is_active, templates(name), crews(name)')
      .eq('org_id', org.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
      .order('start_date', { ascending: false }),
    supabase
      .from('inspections')
      .select('id, started_at, completed_at, total_score')
      .eq('org_id', org.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(10),
    supabase
      .from('issues')
      .select('id, title, status, severity, created_at')
      .eq('org_id', org.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false }),
  ]);

  const opportunityIds =
    (await supabase
      .from('opportunities')
      .select('id')
      .eq('org_id', org.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`))
      .data?.map((o) => o.id) ?? [];
  let bidsViaOpp: { id: string; status: string; total_estimated_cost?: number; opportunity_id?: string; created_at: string }[] = [];
  if (opportunityIds.length > 0) {
    const { data: bidRows } = await supabase
      .from('bids')
      .select('id, status, total_estimated_cost, opportunity_id, created_at')
      .eq('org_id', org.org_id)
      .in('opportunity_id', opportunityIds)
      .order('created_at', { ascending: false });
    bidsViaOpp = bidRows ?? [];
  }
  const allBids = [...(bids.data ?? []), ...bidsViaOpp].filter(
    (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i
  );

  const { data: crews } = await supabase.from('crews').select('id, name').eq('org_id', org.org_id).order('name');

  const launchPlan = await getLaunchPlanByLocation(org.org_id, locationId);
  const activeCrewCount = (crewAssignments.data ?? []).filter((ca) => ca.is_active).length;
  const scheduleExists = (schedules.data ?? []).some((s) => s.is_active);
  const lastInspection = (inspections.data ?? [])[0];
  const openIssuesCount = (issues.data ?? []).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/sites" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{location.name}</h1>
            <p className="text-muted-foreground text-sm">
              {client?.data?.name && (
                <>
                  <Link href={`/app/crm/clients/${client.data.id}`} className="hover:underline">{client.data.name}</Link>
                  {' · '}
                </>
              )}
              Site (location)
            </p>
          </div>
        </div>
        <Link href={`/app/sites/${locationId}/edit`}>
          <Button variant="outline">Edit site</Button>
        </Link>
      </div>

      {launchPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Launch Plan
            </CardTitle>
            <CardDescription>Sales → Ops handoff for this site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{launchPlan.status.replace('_', ' ')}</Badge>
              {launchPlan.start_date && <span className="text-sm text-muted-foreground">Start: {launchPlan.start_date}</span>}
              <span className="text-sm">{activeCrewCount > 0 ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <XCircle className="h-4 w-4 text-muted-foreground inline" />} Crew</span>
              <span className="text-sm">{scheduleExists ? <CheckCircle2 className="h-4 w-4 text-green-600 inline" /> : <XCircle className="h-4 w-4 text-muted-foreground inline" />} Schedule</span>
              {lastInspection?.total_score != null && <span className="text-sm text-muted-foreground">Last inspection: {lastInspection.total_score}</span>}
              {openIssuesCount > 0 && <span className="text-sm text-amber-600">{openIssuesCount} open issue(s)</span>}
            </div>
            <Link href={`/app/crm/opportunities/${launchPlan.opportunity_id}?tab=launch_plan`}>
              <Button variant="outline" size="sm">Open launch plan</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <SiteDetailTabs
        activeTab={tab ?? 'overview'}
        location={location as Record<string, unknown>}
        client={client?.data ?? null}
        contacts={contacts.data ?? []}
        walkthroughs={walkthroughs.data ?? []}
        bids={allBids}
        crewAssignments={crewAssignments.data ?? []}
        schedules={schedules.data ?? []}
        inspections={inspections.data ?? []}
        issues={issues.data ?? []}
        crews={crews ?? []}
        orgId={org.org_id}
        locationId={locationId}
      />
    </div>
  );
}
