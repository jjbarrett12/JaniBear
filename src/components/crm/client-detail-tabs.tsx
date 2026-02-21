'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AddActivityForm } from './add-activity-form';
import {
  MapPin,
  Briefcase,
  Activity,
  FileText,
  LayoutGrid,
  Phone,
  Globe,
} from 'lucide-react';

type TabId = 'overview' | 'locations' | 'opportunities' | 'activity' | 'documents';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'locations', label: 'Sites', icon: MapPin },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'documents', label: 'Documents', icon: FileText },
];

type Client = { id: string; name: string; status?: string; industry?: string; website?: string; phone?: string };
type Location = { id: string; name: string; address?: string | null; city?: string | null; state?: string | null; zip?: string | null };
type Contact = { id: string; first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null; contact_type?: string | null };
type Opportunity = { id: string; stage: string; est_mrr?: number | null; created_at: string };
type ActivityRow = { id: string; type: string; subject?: string | null; due_at?: string | null; completed_at?: string | null; created_at: string };

export function ClientDetailTabs({
  clientId,
  orgId,
  client,
  locations,
  contacts,
  opportunities,
  recentActivities,
}: {
  clientId: string;
  orgId: string;
  client: Client;
  locations: Location[];
  contacts: Contact[];
  opportunities: Opportunity[];
  recentActivities: ActivityRow[];
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(id)}
          >
            <Icon className="mr-1.5 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm">
              {client.status && <p><span className="text-muted-foreground">Status:</span> {client.status}</p>}
              {client.industry && <p><span className="text-muted-foreground">Industry:</span> {client.industry}</p>}
              {client.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </p>
              )}
              {client.website && (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{client.website}</a>
                </p>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{locations.length} site(s), {contacts.length} contact(s), {opportunities.length} opportunity(ies)</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'locations' && (
        <Card>
          <CardHeader>
            <CardTitle>Sites</CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length ? (
              <ul className="space-y-2">
                {locations.map((loc) => (
                  <li key={loc.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Link href={`/app/sites/${loc.id}`} className="hover:underline font-medium">{loc.name}</Link>
                    {(loc.city || loc.state || loc.zip) && (
                      <span className="text-muted-foreground">
                        {[loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No sites linked.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'opportunities' && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {opportunities.length ? (
              <ul className="space-y-2">
                {opportunities.map((opp) => (
                  <li key={opp.id}>
                    <Link href={`/app/crm/opportunities/${opp.id}`} className="hover:underline font-medium">{opp.stage}</Link>
                    <span className="text-muted-foreground text-sm ml-2">
                      {opp.est_mrr != null ? `$${Number(opp.est_mrr).toLocaleString()}/mo` : ''} • {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No opportunities.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <AddActivityForm clientId={clientId} orgId={orgId} />
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length ? (
                <ul className="space-y-2">
                  {recentActivities.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="capitalize">{a.type}</span>
                      {a.subject && <span className="text-muted-foreground">— {a.subject}</span>}
                      {a.completed_at ? <span className="text-green-600">Done</span> : a.due_at && <span>Due {new Date(a.due_at).toLocaleDateString()}</span>}
                      <span className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No activity yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Documents section — placeholder. Link to contracts or uploads when ready.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
