import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, UserPlus, Calendar, FileText, ArrowRight, Phone, Mail, Target, ListOrdered } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-slate-100 text-slate-800' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
  { key: 'walkthrough_scheduled', label: 'Walk-through Scheduled', color: 'bg-amber-100 text-amber-800' },
  { key: 'walkthrough_done', label: 'Walk-through Done', color: 'bg-violet-100 text-violet-800' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'bg-amber-100 text-amber-800' },
  { key: 'won', label: 'Won', color: 'bg-green-100 text-green-800' },
  { key: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-600' },
];

export default async function SalesDashboardPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: false });

  const byStage = (STAGES as { key: string }[]).reduce<Record<string, typeof leads>>((acc, { key }) => {
    acc[key] = (leads || []).filter((l: { status?: string }) => l.status === key);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Lead → Walk-through</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/sales/cadence">
            <Button variant="outline" className="gap-2">
              <ListOrdered className="h-4 w-4" />
              10-Touch Cadence
            </Button>
          </Link>
          <Link href="/app/sales/top-targets">
            <Button variant="outline" className="gap-2">
              <Target className="h-4 w-4" />
              My Top 10
            </Button>
          </Link>
          <Link href="/app/sales/leads/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{byStage.new?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Walk-throughs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(byStage.walkthrough_scheduled?.length ?? 0) + (byStage.walkthrough_done?.length ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proposals Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{byStage.proposal_sent?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{byStage.won?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-2">
              {STAGES.filter(s => s.key !== 'lost').map((stage) => (
                <div key={stage.key} className="w-56 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{(byStage[stage.key]?.length ?? 0)}</span>
                  </div>
                  <div className="space-y-2 min-h-[120px] rounded-lg border border-dashed border-border bg-muted/30 p-2">
                    {(byStage[stage.key] || []).slice(0, 5).map((lead: { id: string; contact_name?: string; company?: string; status?: string }) => (
                      <Link key={lead.id} href={`/app/sales/leads/${lead.id}`}>
                        <div className="p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-shadow cursor-pointer">
                          <p className="font-medium text-sm truncate text-foreground">{lead.contact_name || lead.company || 'Unnamed'}</p>
                          {lead.company && lead.contact_name && (
                            <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                          )}
                          <ArrowRight className="h-3 w-3 text-muted-foreground mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Link href="/app/sales/leads/new">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Import Lead
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {leads && leads.length > 0 ? (
            <div className="space-y-2">
              {leads.slice(0, 10).map((lead: {
                id: string;
                contact_name?: string;
                company?: string;
                email?: string;
                phone?: string;
                status?: string;
                created_at?: string;
              }) => (
                <Link key={lead.id} href={`/app/sales/leads/${lead.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{lead.contact_name || lead.company || 'Unnamed Lead'}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {lead.company && <span>{lead.company}</span>}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {lead.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        STAGES.find(s => s.key === lead.status)?.color ?? 'bg-gray-100 text-gray-800'
                      }`}>
                        {STAGES.find(s => s.key === lead.status)?.label ?? lead.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(lead.created_at)}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No leads yet. Import your first lead to start the sales flow.</p>
              <Link href="/app/sales/leads/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
