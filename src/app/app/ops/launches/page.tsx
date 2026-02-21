import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getLaunchPlansForOpsList, getLaunchPlanAccess } from '@/actions/launch-plan';
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
import { Rocket, CheckCircle2, XCircle } from 'lucide-react';
import { OpsLaunchesFilters } from '@/components/crm/ops-launches-filters';

export default async function OpsLaunchesPage({
  searchParams,
}: {
  searchParams: Promise<{ blocked?: string; not_ops_ready?: string; ops_owner?: string }>;
}) {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const params = await searchParams;
  const blockedOnly = params.blocked === '1';
  const notOpsReady = params.not_ops_ready === '1';
  const myPlansOnly = params.ops_owner === 'me';
  const [plans, access] = await Promise.all([
    getLaunchPlansForOpsList(org.org_id, {
      blockedOnly,
      notOpsReady,
      opsOwnerId: myPlansOnly && userId ? userId : undefined,
    }),
    getLaunchPlanAccess(),
  ]);

  if (!access.canRead) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Ops Launches</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don’t have access to view launch plans.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          Ops Launches
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sales → Ops handoff: plans starting in the next 30 days or in sales_ready / ops_ready / blocked.
        </p>
      </div>

      <OpsLaunchesFilters blockedOnly={blockedOnly} notOpsReady={notOpsReady} myPlansOnly={myPlansOnly} />

      <Card>
        <CardHeader>
          <CardTitle>Launch plans</CardTitle>
          <CardDescription>
            {plans.length} plan(s). Open an opportunity to view or edit the launch plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>Crew?</TableHead>
                <TableHead>Schedule?</TableHead>
                <TableHead>Inspection?</TableHead>
                <TableHead>Risks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.client_name ?? '—'}</TableCell>
                  <TableCell>{p.location_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'blocked' ? 'destructive' : 'secondary'}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.start_date ?? '—'}</TableCell>
                  <TableCell>{p.crew_assigned ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{p.schedule_exists ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{p.inspection_planned ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                  <TableCell>{p.risk_count}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/app/crm/opportunities/${p.opportunity_id}?tab=launch_plan`}>
                      <Button variant="ghost" size="sm">Open</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!plans.length && (
            <p className="text-center text-muted-foreground py-8 text-sm">No launch plans match the filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
