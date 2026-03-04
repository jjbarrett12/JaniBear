'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutGrid,
  Users,
  MapPin,
  FileText,
  Users as CrewsIcon,
  ClipboardCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { assignCrewToSite } from '@/actions/sites';
import { formatDate } from '@/lib/utils';

type TabId = 'overview' | 'contacts' | 'walkthroughs' | 'bids' | 'ops' | 'qc';

export function SiteDetailTabs({
  activeTab,
  location,
  client,
  contacts,
  walkthroughs,
  bids,
  crewAssignments,
  schedules,
  inspections,
  issues,
  crews,
  orgId,
  locationId,
}: {
  activeTab: string;
  location: Record<string, unknown>;
  client: { id: string; name: string } | null;
  contacts: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; contact_type?: string | null }[];
  walkthroughs: { id: string; status: string; scheduled_at?: string | null; opportunity_id?: string | null; opportunities?: { stage: string } | null }[];
  bids: { id: string; status: string; total_estimated_cost?: number; opportunity_id?: string; created_at: string }[];
  crewAssignments: { id: string; crew_id: string; start_date?: string | null; end_date?: string | null; is_active: boolean; crews?: { name: string } | null }[];
  schedules: { id: string; start_date: string; recurrence: string; is_active: boolean; templates?: { name: string } | null; crews?: { name: string } | null }[];
  inspections: { id: string; started_at: string; completed_at?: string | null; total_score?: number | null }[];
  issues: { id: string; title: string; status: string; severity?: string; created_at: string }[];
  crews: { id: string; name: string }[];
  orgId: string;
  locationId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [assigning, setAssigning] = useState(false);
  const [assignCrewId, setAssignCrewId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const setTab = (tab: TabId) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (tab === 'overview') p.delete('tab');
    else p.set('tab', tab);
    router.push(pathname + (p.toString() ? `?${p.toString()}` : ''));
  };

  const handleAssignCrew = async () => {
    if (!assignCrewId) return;
    setAssigning(true);
    setAssignError(null);
    const res = await assignCrewToSite(orgId, locationId, assignCrewId);
    if (res.error) setAssignError(res.error);
    else {
      setAssignCrewId('');
      router.refresh();
    }
    setAssigning(false);
  };

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'walkthroughs', label: 'Walkthroughs', icon: MapPin },
    { id: 'bids', label: 'Bids', icon: FileText },
    { id: 'ops', label: 'Ops', icon: CrewsIcon },
    { id: 'qc', label: 'QC', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab(id)}
          >
            <Icon className="mr-1.5 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Site overview</CardTitle>
            <CardDescription>{location.name as string}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {client && (
              <p>
                <span className="text-muted-foreground">Client: </span>
                <Link href={`/app/crm/clients/${client.id}`} className="hover:underline font-medium">{client.name}</Link>
              </p>
            )}
            <p><span className="text-muted-foreground">Address: </span>{[location.address, location.city, location.state, location.zip].filter(Boolean).join(', ') || '—'}</p>
            <p><span className="text-muted-foreground">Square footage: </span>{location.square_footage != null ? Number(location.square_footage).toLocaleString() : '—'}</p>
            <p><span className="text-muted-foreground">Restrooms: </span>{location.restroom_count ?? '—'}</p>
            <p><span className="text-muted-foreground">Days of service: </span>{location.days_of_service ?? '—'}</p>
            <p><span className="text-muted-foreground">Door/alarm code: </span>{location.door_alarm_code ?? '—'}</p>
            {location.notes && <p><span className="text-muted-foreground">Notes: </span><span className="whitespace-pre-wrap">{String(location.notes)}</span></p>}
          </CardContent>
        </Card>
      )}

      {activeTab === 'contacts' && (
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>CRM contacts linked to this site or client</CardDescription>
          </CardHeader>
          <CardContent>
            {contacts.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{(c.first_name || c.last_name) ? [c.first_name, c.last_name].filter(Boolean).join(' ') : '—'}</TableCell>
                      <TableCell>{c.email ?? '—'}</TableCell>
                      <TableCell>{c.phone ?? '—'}</TableCell>
                      <TableCell>{c.contact_type ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No contacts linked.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'walkthroughs' && (
        <Card>
          <CardHeader>
            <CardTitle>Walkthroughs</CardTitle>
            <CardDescription>Walkthroughs at this site</CardDescription>
          </CardHeader>
          <CardContent>
            {walkthroughs.length ? (
              <ul className="space-y-2">
                {walkthroughs.map((w) => (
                  <li key={w.id}>
                    <Link href={`/app/walkthroughs/${w.id}`} className="hover:underline font-medium">{w.status}</Link>
                    {w.scheduled_at && <span className="text-muted-foreground text-sm ml-2">{w.scheduled_at ? formatDate(w.scheduled_at) : '—'}</span>}
                    {w.opportunities?.stage && <Badge variant="outline" className="ml-2">{w.opportunities.stage}</Badge>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No walkthroughs.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'bids' && (
        <Card>
          <CardHeader>
            <CardTitle>Bids</CardTitle>
            <CardDescription>Bids for this site or its opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            {bids.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell><Badge variant="secondary">{b.status}</Badge></TableCell>
                      <TableCell>{b.total_estimated_cost != null ? `$${Number(b.total_estimated_cost).toLocaleString()}` : '—'}</TableCell>
                      <TableCell>{formatDate(b.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/app/bids/${b.id}`}><Button variant="ghost" size="sm">View</Button></Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm">No bids.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'ops' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crew assignment</CardTitle>
              <CardDescription>Assign a crew to this site (writes crew_assignments)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {assignError && <p className="text-sm text-destructive">{assignError}</p>}
              <div className="flex flex-wrap items-end gap-2">
                <Select value={assignCrewId} onValueChange={setAssignCrewId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {crews.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignCrew} disabled={assigning || !assignCrewId}>
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Assign crew
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active crew assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {crewAssignments.filter((ca) => ca.is_active).length ? (
                <ul className="space-y-1 text-sm">
                  {crewAssignments.filter((ca) => ca.is_active).map((ca) => (
                    <li key={ca.id}>{(ca.crews as { name: string })?.name ?? 'Crew'} {ca.start_date && `from ${ca.start_date}`}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No crew assigned.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Schedules (read-only)</CardTitle>
              <CardDescription>Recurring schedules for this site</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.filter((s) => s.is_active).length ? (
                <ul className="space-y-1 text-sm">
                  {schedules.filter((s) => s.is_active).map((s) => (
                    <li key={s.id}>{(s.templates as { name: string })?.name ?? 'Template'} · {(s.crews as { name: string })?.name ?? '—'} · {s.start_date}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No active schedules.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'qc' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Last inspections (read-only)</CardTitle>
              <CardDescription>Recent inspections at this site</CardDescription>
            </CardHeader>
            <CardContent>
              {inspections.length ? (
                <ul className="space-y-1 text-sm">
                  {inspections.slice(0, 5).map((i) => (
                    <li key={i.id}>
                      <Link href={`/app/inspections/${i.id}`} className="hover:underline">
                        {i.completed_at ? formatDate(i.completed_at) : 'In progress'}
                      </Link>
                      {i.total_score != null && <span className="text-muted-foreground ml-2">Score: {i.total_score}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No inspections yet.</p>
              )}
              <Link href={`/app/inspections/start?location=${locationId}`} className="inline-block mt-2">
                <Button variant="outline" size="sm">Start inspection</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open issues (read-only)</CardTitle>
              <CardDescription>Unresolved issues at this site</CardDescription>
            </CardHeader>
            <CardContent>
              {issues.length ? (
                <ul className="space-y-2">
                  {issues.map((i) => (
                    <li key={i.id}>
                      <Link href={`/app/issues/${i.id}`} className="hover:underline font-medium">{i.title}</Link>
                      <Badge variant="outline" className="ml-2">{i.status}</Badge>
                      <span className="text-muted-foreground text-sm ml-2">{formatDate(i.created_at)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No open issues.</p>
              )}
              <Link href={`/app/issues?location=${locationId}`} className="inline-block mt-2">
                <Button variant="outline" size="sm">View all issues</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
