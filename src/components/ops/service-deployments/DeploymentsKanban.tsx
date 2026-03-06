'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { DeploymentCard } from './DeploymentCard';
import type { ServiceDeploymentRow } from '@/lib/service-deployments/types';
import { DEPLOYMENT_STAGES, STAGE_LABELS } from '@/lib/service-deployments/types';
import type { DeploymentStage } from '@/lib/service-deployments/types';
import { GripVertical } from 'lucide-react';

export interface DeploymentsKanbanProps {
  deployments: ServiceDeploymentRow[];
  onSelectDeployment: (d: ServiceDeploymentRow) => void;
  onMoveDeployment: (deploymentId: string, newStage: DeploymentStage) => Promise<void>;
}

export function DeploymentsKanban({
  deployments,
  onSelectDeployment,
  onMoveDeployment,
}: DeploymentsKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetStage, setDropTargetStage] = useState<DeploymentStage | null>(null);

  const byStage = React.useMemo(() => {
    const map = new Map<DeploymentStage, ServiceDeploymentRow[]>();
    DEPLOYMENT_STAGES.forEach((s) => map.set(s, []));
    deployments.forEach((d) => {
      const stage = d.stage as DeploymentStage;
      if (map.has(stage)) map.get(stage)!.push(d);
    });
    return map;
  }, [deployments]);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('application/json', JSON.stringify({ deploymentId: id }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetStage(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stage: DeploymentStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetStage(stage);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTargetStage(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, stage: DeploymentStage) => {
      e.preventDefault();
      setDropTargetStage(null);
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return;
        const { deploymentId } = JSON.parse(raw) as { deploymentId: string };
        if (deploymentId) {
          setDraggedId(null);
          await onMoveDeployment(deploymentId, stage);
        }
      } finally {
        setDraggedId(null);
      }
    },
    [onMoveDeployment]
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[420px]">
      {DEPLOYMENT_STAGES.map((stage) => (
        <div
          key={stage}
          className={cn(
            'flex-shrink-0 w-[280px] rounded-xl border bg-muted/30 flex flex-col overflow-hidden',
            dropTargetStage === stage && 'ring-2 ring-primary/50 border-primary/50'
          )}
          onDragOver={(e) => handleDragOver(e, stage)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, stage)}
        >
          <div className="px-3 py-2.5 border-b border-border bg-muted/50">
            <h3 className="text-sm font-semibold text-foreground">{STAGE_LABELS[stage]}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(byStage.get(stage) ?? []).length} card{(byStage.get(stage) ?? []).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(byStage.get(stage) ?? []).map((d) => (
              <div
                key={d.id}
                draggable
                onDragStart={(e) => handleDragStart(e, d.id)}
                onDragEnd={handleDragEnd}
                className="group relative cursor-grab active:cursor-grabbing"
              >
                <DeploymentCard
                  deployment={d}
                  onClick={() => onSelectDeployment(d)}
                  isDragging={draggedId === d.id}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
