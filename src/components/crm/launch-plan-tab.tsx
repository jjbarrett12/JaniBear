'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Rocket } from 'lucide-react';
import {
  getLaunchPlanByOpportunity,
  createLaunchPlan,
  updateSalesInputs,
  updateOpsSetup,
  updateLaunchPlanFields,
  transitionStatus,
  computeReadiness,
  type LaunchPlanRow,
  type ReadinessResult,
} from '@/actions/launch-plan';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted',
  sales_ready: 'bg-blue-100 text-blue-800',
  ops_ready: 'bg-amber-100 text-amber-800',
  launched: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

export function LaunchPlanTab({
  opportunityId,
  orgId,
  initialPlan,
  initialReadiness,
  canWrite,
}: {
  opportunityId: string;
  orgId: string;
  initialPlan: LaunchPlanRow | null;
  initialReadiness: ReadinessResult;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<LaunchPlanRow | null>(initialPlan);
  const [readiness, setReadiness] = useState<ReadinessResult>(initialReadiness);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const salesInputs = (plan?.sales_inputs as Record<string, unknown>) ?? {};
  const opsSetup = (plan?.ops_setup as Record<string, unknown>) ?? {};

  const refresh = async () => {
    const [newPlan, newReadiness] = await Promise.all([
      getLaunchPlanByOpportunity(orgId, opportunityId),
      computeReadiness(opportunityId),
    ]);
    setPlan(newPlan);
    setReadiness(newReadiness);
    router.refresh();
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const res = await createLaunchPlan(opportunityId);
    if (res.error) setError(res.error);
    else await refresh();
    setLoading(false);
  };

  const handleSalesBlur = async (field: string, value: string) => {
    if (!plan || !canWrite) return;
    const next = { ...salesInputs, [field]: value || undefined };
    await updateSalesInputs(plan.id, next);
    const nextReadiness = await computeReadiness(opportunityId);
    setReadiness(nextReadiness);
    setPlan({ ...plan, sales_inputs: next });
    router.refresh();
  };

  const handleOpsBlur = async (field: string, value: string | boolean) => {
    if (!plan || !canWrite) return;
    const next = { ...opsSetup, [field]: value };
    await updateOpsSetup(plan.id, next);
    const nextReadiness = await computeReadiness(opportunityId);
    setReadiness(nextReadiness);
    setPlan({ ...plan, ops_setup: next });
    router.refresh();
  };

  const handleStartDate = async (value: string) => {
    if (!plan || !canWrite) return;
    await updateLaunchPlanFields(plan.id, { start_date: value || null });
    setPlan({ ...plan, start_date: value || null });
    const nextReadiness = await computeReadiness(opportunityId);
    setReadiness(nextReadiness);
    router.refresh();
  };

  const handleStatus = async (newStatus: 'sales_ready' | 'ops_ready' | 'launched' | 'blocked') => {
    if (!plan || !canWrite) return;
    if (newStatus === 'blocked' && !blockReason.trim()) {
      setError('Please enter a reason for blocking.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await transitionStatus(plan.id, newStatus, newStatus === 'blocked' ? blockReason : undefined);
    if (res.error) setError(res.error);
    else await refresh();
    if (newStatus === 'blocked') setBlockReason('');
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!plan && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm mb-4">
              Create a launch plan to hand off this opportunity from Sales to Ops. One plan per opportunity.
            </p>
            {canWrite && (
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                Create Launch Plan
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {plan && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={STATUS_COLORS[plan.status] ?? 'bg-muted'}>{plan.status.replace('_', ' ')}</Badge>
            {plan.start_date && (
              <span className="text-sm text-muted-foreground">Start: {plan.start_date}</span>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className={readiness.salesReady ? 'text-green-600' : 'text-muted-foreground'}>
                {readiness.salesReady ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : null}
                Sales ready
              </span>
              <span className="text-muted-foreground">|</span>
              <span className={readiness.opsReady ? 'text-green-600' : 'text-muted-foreground'}>
                {readiness.opsReady ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : null}
                Ops ready
              </span>
            </div>
          </div>

          {readiness.missing.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Missing / incomplete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {readiness.missing.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {readiness.riskFlags.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base">Risk flags</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {readiness.riskFlags.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.severity}</Badge>
                      {r.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sales inputs</CardTitle>
                <p className="text-xs text-muted-foreground">Service window, access, scope, contacts</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!canWrite && <p className="text-sm text-muted-foreground">View only (inspector).</p>}
                <div className="space-y-2">
                  <Label>Service window</Label>
                  <Input
                    placeholder="e.g. Mon/Wed/Fri 6–10pm"
                    defaultValue={(salesInputs.service_window as string) ?? ''}
                    onBlur={(e) => handleSalesBlur('service_window', e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access / alarm code</Label>
                  <Input
                    placeholder="Door code or alarm notes"
                    defaultValue={(salesInputs.access_security as string) ?? (salesInputs.door_code as string) ?? ''}
                    onBlur={(e) => handleSalesBlur('access_security', e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scope summary</Label>
                  <Textarea
                    placeholder="Janitorial scope in brief"
                    defaultValue={(salesInputs.scope_summary as string) ?? ''}
                    onBlur={(e) => handleSalesBlur('scope_summary', e.target.value)}
                    disabled={!canWrite}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Included / excluded services</Label>
                  <Textarea
                    placeholder="What’s in scope and what’s not"
                    defaultValue={(salesInputs.included_services as string) ?? (salesInputs.excluded_services as string) ?? ''}
                    onBlur={(e) => handleSalesBlur('included_services', e.target.value)}
                    disabled={!canWrite}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="contacts_unknown"
                    defaultChecked={salesInputs.contacts_unknown === true || salesInputs.contacts_unknown === 'true'}
                    onChange={(e) => handleSalesBlur('contacts_unknown', e.target.checked)}
                    disabled={!canWrite}
                  />
                  <Label htmlFor="contacts_unknown">Contacts unknown / TBD</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ops setup</CardTitle>
                <p className="text-xs text-muted-foreground">Crew, schedule, inspection</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input
                    type="date"
                    value={plan.start_date ?? ''}
                    onChange={(e) => handleStartDate(e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Crew ID (if chosen)</Label>
                  <Input
                    placeholder="Crew UUID or leave blank"
                    defaultValue={(opsSetup.crew_id as string) ?? ''}
                    onBlur={(e) => handleOpsBlur('crew_id', e.target.value)}
                    disabled={!canWrite}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="schedule_planned"
                    defaultChecked={opsSetup.schedule_planned === true}
                    onChange={(e) => handleOpsBlur('schedule_planned', e.target.checked)}
                    disabled={!canWrite}
                  />
                  <Label htmlFor="schedule_planned">Schedule planned</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="inspection_planned"
                    defaultChecked={opsSetup.inspection_planned === true}
                    onChange={(e) => handleOpsBlur('inspection_planned', e.target.checked)}
                    disabled={!canWrite}
                  />
                  <Label htmlFor="inspection_planned">Inspection planned</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {canWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {plan.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatus('sales_ready')} disabled={loading}>
                    Mark Sales Ready
                  </Button>
                )}
                {plan.status === 'sales_ready' && (
                  <Button variant="outline" size="sm" onClick={() => handleStatus('ops_ready')} disabled={loading}>
                    Mark Ops Ready
                  </Button>
                )}
                {(plan.status === 'ops_ready' || plan.status === 'sales_ready') && (
                  <Button size="sm" onClick={() => handleStatus('launched')} disabled={loading}>
                    Mark Launched
                  </Button>
                )}
                {plan.status !== 'blocked' && plan.status !== 'launched' && (
                  <>
                    <Input
                      placeholder="Reason for block"
                      className="max-w-xs"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                    />
                    <Button variant="destructive" size="sm" onClick={() => handleStatus('blocked')} disabled={loading}>
                      Block
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
