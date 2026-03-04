import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, AlertCircle } from 'lucide-react';
import { SitesSearchFilter } from '@/components/crm/sites-search-filter';

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; has_issues?: string; crew?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const statusFilter = params.status;
  const hasIssues = params.has_issues === '1';
  const crewId = params.crew;

  let query = supabase
    .from('locations')
    .select(`
      id,
      name,
      address,
      city,
      state,
      zip,
      status,
      square_footage,
      restroom_count,
      client_id,
      clients (id, name)
    `)
    .eq('org_id', org.org_id)
    .order('name');

  if (statusFilter === 'active' || statusFilter === 'inactive') {
    query = query.eq('status', statusFilter);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,city.ilike.%${q}%`);
  }

  const { data: locations } = await query;

  const locationIds = (locations ?? []).map((l) => l.id);

  const locIdSet = new Set(locationIds);
  const [crewRows, inspectionRows, issueRows] = await Promise.all([
    supabase.from('crew_assignments').select('location_id, facility_id, crew_id, crews(name)').eq('org_id', org.org_id).eq('is_active', true),
    locationIds.length ? supabase.from('inspections').select('location_id, facility_id, completed_at').eq('org_id', org.org_id).not('completed_at', 'is', null).order('completed_at', { ascending: false }) : { data: [] },
    supabase.from('issues').select('location_id, facility_id').eq('org_id', org.org_id).neq('status', 'resolved'),
  ]);

  const crewAssignments = new Map<string, { crewName: string }[]>();
  (crewRows.data ?? []).forEach((ca: { location_id?: string; facility_id?: string; crews?: { name: string } | null }) => {
    const locId = ca.location_id ?? ca.facility_id;
    if (!locId || !locIdSet.has(locId)) return;
    const arr = crewAssignments.get(locId) ?? [];
    arr.push({ crewName: (ca.crews as { name: string })?.name ?? 'Crew' });
    crewAssignments.set(locId, arr);
  });

  const inspectionsByLoc = new Map<string, string>();
  (inspectionRows.data ?? []).forEach((i: { location_id?: string; facility_id?: string; completed_at: string }) => {
    const locId = i.location_id ?? i.facility_id;
    if (locId && locIdSet.has(locId) && !inspectionsByLoc.has(locId)) inspectionsByLoc.set(locId, i.completed_at);
  });

  const issuesByLoc = new Map<string, number>();
  (issueRows.data ?? []).forEach((i: { location_id?: string; facility_id?: string }) => {
    const locId = i.location_id ?? i.facility_id;
    if (locId && locIdSet.has(locId)) issuesByLoc.set(locId, (issuesByLoc.get(locId) ?? 0) + 1);
  });

  const { data: crews } = await supabase.from('crews').select('id, name').eq('org_id', org.org_id).order('name');

  let rows = locations ?? [];
  if (hasIssues) {
    rows = rows.filter((l) => (issuesByLoc.get(l.id) ?? 0) > 0);
  }
  if (crewId) {
    const assignedLocIds = new Set(
      (await supabase
        .from('crew_assignments')
        .select('location_id, facility_id')
        .eq('org_id', org.org_id)
        .eq('crew_id', crewId)
        .eq('is_active', true))
        .data?.map((ca: { location_id?: string; facility_id?: string }) => ca.location_id ?? ca.facility_id) ?? []
    );
    rows = rows.filter((l) => assignedLocIds.has(l.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sites</h1>
          <p className="text-muted-foreground mt-1">Locations (sites) linked to clients and ops</p>
        </div>
        <Link href="/app/sites/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </Button>
        </Link>
      </div>

      <SitesSearchFilter
        initialQ={q}
        initialStatus={statusFilter}
        initialHasIssues={hasIssues}
        initialCrewId={crewId}
        crews={crews ?? []}
      />

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sq ft</TableHead>
              <TableHead>Crew</TableHead>
              <TableHead>Last inspection</TableHead>
              <TableHead>Open issues</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((loc: { id: string; name: string; address?: string | null; city?: string | null; state?: string | null; status?: string; square_footage?: number | null; client_id?: string | null; clients?: { name: string } | null }) => (
              <TableRow key={loc.id}>
                <TableCell>
                  <div className="font-medium">{loc.name}</div>
                  {(loc.address || loc.city) && (
                    <div className="text-xs text-muted-foreground">
                      {[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {loc.client_id && (loc.clients as { name: string })?.name ? (
                    <Link href={`/app/crm/clients/${loc.client_id}`} className="hover:underline text-sm">
                      {(loc.clients as { name: string }).name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={loc.status === 'active' ? 'default' : 'secondary'}>{loc.status ?? 'active'}</Badge>
                </TableCell>
                <TableCell>{loc.square_footage != null ? loc.square_footage.toLocaleString() : '—'}</TableCell>
                <TableCell>
                  {(crewAssignments.get(loc.id) ?? []).map((c, i) => (
                    <span key={i} className="text-sm">{c.crewName}</span>
                  ))}
                  {!(crewAssignments.get(loc.id)?.length) && '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {inspectionsByLoc.get(loc.id) ? new Date(inspectionsByLoc.get(loc.id)!).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  {(issuesByLoc.get(loc.id) ?? 0) > 0 ? (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      {issuesByLoc.get(loc.id)}
                    </span>
                  ) : (
                    '0'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/app/sites/${loc.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No sites found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
