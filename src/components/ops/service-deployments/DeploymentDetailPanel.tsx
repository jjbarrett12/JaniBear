'use client';

import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DeploymentWithDetails } from '@/lib/service-deployments/types';
import { DEPLOYMENT_TYPE_LABELS, STAGE_LABELS } from '@/lib/service-deployments/types';
import type { DeploymentStage } from '@/lib/service-deployments/types';
import { format } from 'date-fns';
import {
  FileText,
  History,
  Users,
  ClipboardCheck,
  BarChart2,
  Loader2,
} from 'lucide-react';

export interface DeploymentDetailPanelProps {
  deploymentId: string | null;
  open: boolean;
  onClose: () => void;
  onStageChange: (deploymentId: string, stage: DeploymentStage) => Promise<void>;
  onCrewAssign: (deploymentId: string, crewId: string | null) => Promise<void>;
  crewOptions: { id: string; name: string }[];
}

export function DeploymentDetailPanel({
  deploymentId,
  open,
  onClose,
  onStageChange,
  onCrewAssign,
  crewOptions,
}: DeploymentDetailPanelProps) {
  const [detail, setDetail] = useState<DeploymentWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigningCrew, setAssigningCrew] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !deploymentId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetch(`/api/app/ops/service-deployments/${deploymentId}`)
      .then((r) => r.json())
      .then((data) => {
        setDetail(data);
        setSelectedCrewId(data.assigned_crew_id ?? null);
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, deploymentId]);

  const handleCrewChange = async (crewId: string | null) => {
    if (!deploymentId) return;
    setAssigningCrew(true);
    try {
      await onCrewAssign(deploymentId, crewId);
      setSelectedCrewId(crewId);
      setDetail((prev) =>
        prev ? { ...prev, assigned_crew_id: crewId, assigned_crew_name: crewOptions.find((c) => c.id === crewId)?.name ?? null } : null
      );
    } finally {
      setAssigningCrew(false);
    }
  };

  const checklist = Array.isArray(detail?.go_live_checklist) ? detail.go_live_checklist as Array<{ id: string; label: string; done: boolean }> : [];
  const metrics = detail?.stabilization_metrics && typeof detail.stabilization_metrics === 'object' ? detail.stabilization_metrics as Record<string, number | string> : {};

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col w-full max-w-lg p-0 sm:max-w-xl">
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg">
            {detail ? detail.account_name : 'Deployment details'}
          </SheetTitle>
        </SheetHeader>
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !detail ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            Failed to load deployment.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{DEPLOYMENT_TYPE_LABELS[detail.deployment_type as keyof typeof DEPLOYMENT_TYPE_LABELS]}</Badge>
                <Badge variant="outline">{STAGE_LABELS[detail.stage as DeploymentStage]}</Badge>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Reason for deployment
                </h3>
                <p className="text-sm text-muted-foreground rounded-lg bg-muted/30 border border-border px-3 py-2">
                  {detail.reason || 'No reason provided.'}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Incident history
                </h3>
                <ul className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                  {detail.events?.length ? (
                    detail.events.map((evt) => (
                      <li key={evt.id} className="text-xs flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {evt.from_stage ? `${evt.from_stage} → ` : ''}{evt.to_stage}
                        </span>
                        <span className="text-muted-foreground/80">
                          {format(new Date(evt.created_at), 'MMM d, HH:mm')}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-muted-foreground">No stage changes yet.</li>
                  )}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Current crew
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {detail.assigned_crew_name || 'No crew assigned.'}
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedCrewId ?? 'none'}
                    onValueChange={(v) => handleCrewChange(v === 'none' ? null : v)}
                    disabled={assigningCrew}
                  >
                    <SelectTrigger className="w-[200px] rounded-lg border-border">
                      <SelectValue placeholder="Assign crew" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No crew</SelectItem>
                      {crewOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assigningCrew && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Recommended crews: use crew capacity and territory to assign.
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                  Go-live checklist
                </h3>
                {checklist.length > 0 ? (
                  <ul className="space-y-1.5 rounded-lg border border-border bg-muted/20 p-3">
                    {checklist.map((item) => (
                      <li key={item.id} className="text-sm flex items-center gap-2">
                        <span className={item.done ? 'text-emerald-600' : 'text-muted-foreground'}>
                          {item.done ? '✓' : '○'} {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-3 py-2">
                    No checklist items. Add in a future update.
                  </p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  Stabilization metrics
                </h3>
                {Object.keys(metrics).length > 0 ? (
                  <dl className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                    {Object.entries(metrics).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <dt className="text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</dt>
                        <dd className="font-medium tabular-nums">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border px-3 py-2">
                    No metrics yet. Available after go-live.
                  </p>
                )}
              </section>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-lg">
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
