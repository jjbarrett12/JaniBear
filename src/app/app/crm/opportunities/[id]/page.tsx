import { requireOrg } from '@/lib/auth';
import { getOpportunityDetail } from '@/actions/crm';
import { getLaunchPlanByOpportunity, computeReadiness, getLaunchPlanAccess } from '@/actions/launch-plan';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, User, DollarSign, LayoutGrid, Rocket } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { OpportunityDetailTabs } from '@/components/crm/opportunity-detail-tabs';
import { LaunchPlanTab } from '@/components/crm/launch-plan-tab';

export default async function OpportunityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const org = await requireOrg();
  const data = await getOpportunityDetail(org.org_id, id);

  if (!data.opportunity) {
    notFound();
  }

  const [plan, readiness, access] = await Promise.all([
    getLaunchPlanByOpportunity(org.org_id, id),
    computeReadiness(id),
    getLaunchPlanAccess(),
  ]);

  const opp = data.opportunity;
  const formatCurrency = (n: number | null | undefined) =>
    n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/crm">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Opportunity — {opp.stage}</h1>
          <p className="text-muted-foreground">
            Est. MRR {formatCurrency(opp.est_mrr)} • Est. value {formatCurrency(opp.est_value)}
          </p>
        </div>
      </div>

      <OpportunityDetailTabs
        activeTab={tab === 'launch_plan' ? 'launch_plan' : 'overview'}
        overviewContent={
          <>
            {!plan && (opp.stage === 'won' || data.bids.some((b) => b.status === 'accepted')) && (
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <p className="font-medium text-foreground mb-1">Ready to hand off to Ops?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create a launch plan to capture sales inputs and ops setup before go-live.
                  </p>
                  <Link href={`/app/crm/opportunities/${id}?tab=launch_plan`}>
                    <Button size="sm">Open Launch Plan tab</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account / client & site</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.client ? (
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/app/crm/clients/${data.client.id}`} className="hover:underline font-medium">{data.client.name}</Link>
                    </p>
                  ) : data.account ? (
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/app/accounts/${data.account.id}`} className="hover:underline font-medium">{data.account.name}</Link>
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No account or client linked</p>
                  )}
                  {data.location ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {data.location.name}
                      {(data.location.city || data.location.address) && ` • ${[data.location.address, data.location.city].filter(Boolean).join(', ')}`}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-sm">No site linked</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bids</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.bids.length ? (
                    <ul className="space-y-2">
                      {data.bids.map((bid) => (
                        <li key={bid.id}>
                          <Link href={`/app/bids/${bid.id}`} className="hover:underline font-medium">
                            {formatCurrency(bid.total_estimated_cost)} — {bid.status}
                          </Link>
                          <span className="text-muted-foreground text-sm ml-2">{formatDate(bid.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">No bids yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activities.length ? (
                  <ul className="space-y-2">
                    {data.activities.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        <span className="capitalize">{a.type}</span>
                        {a.subject && <span className="text-muted-foreground">— {a.subject}</span>}
                        {a.completed_at ? <span className="text-green-600">Done</span> : a.due_at && <span>Due {formatDate(a.due_at)}</span>}
                        <span className="text-muted-foreground">{formatDate(a.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No activity yet.</p>
                )}
              </CardContent>
            </Card>

            {data.walkthroughs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Walkthroughs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.walkthroughs.map((w) => (
                      <li key={w.id}>
                        <Link href={`/app/walkthroughs/${w.id}`} className="hover:underline font-medium">{w.status}</Link>
                        {w.scheduled_at && <span className="text-muted-foreground text-sm ml-2">{formatDate(w.scheduled_at)}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        }
        launchPlanContent={
          <LaunchPlanTab
            opportunityId={id}
            orgId={org.org_id}
            initialPlan={plan}
            initialReadiness={readiness}
            canWrite={access.canWrite}
          />
        }
      />
    </div>
  );
}
