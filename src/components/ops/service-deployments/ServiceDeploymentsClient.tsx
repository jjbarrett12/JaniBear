'use client';

import React, { useState, useCallback } from 'react';
import { DeploymentsKanban } from './DeploymentsKanban';
import { DeploymentDetailPanel } from './DeploymentDetailPanel';
import type { ServiceDeploymentRow } from '@/lib/service-deployments/types';
import type { DeploymentStage } from '@/lib/service-deployments/types';

export interface ServiceDeploymentsClientProps {
  initialDeployments: ServiceDeploymentRow[];
  crewOptions: { id: string; name: string }[];
}

export function ServiceDeploymentsClient({
  initialDeployments,
  crewOptions,
}: ServiceDeploymentsClientProps) {
  const [deployments, setDeployments] = useState<ServiceDeploymentRow[]>(initialDeployments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleSelectDeployment = useCallback((d: ServiceDeploymentRow) => {
    setSelectedId(d.id);
    setDetailOpen(true);
  }, []);

  const handleMoveDeployment = useCallback(async (deploymentId: string, newStage: DeploymentStage) => {
    const res = await fetch(`/api/app/ops/service-deployments/${deploymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    if (!res.ok) return;
    setDeployments((prev) =>
      prev.map((d) => (d.id === deploymentId ? { ...d, stage: newStage } : d))
    );
  }, []);

  const handleCrewAssign = useCallback(async (deploymentId: string, crewId: string | null) => {
    const res = await fetch(`/api/app/ops/service-deployments/${deploymentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_crew_id: crewId }),
    });
    if (!res.ok) return;
    const crewName = crewId ? crewOptions.find((c) => c.id === crewId)?.name ?? null : null;
    setDeployments((prev) =>
      prev.map((d) =>
        d.id === deploymentId ? { ...d, assigned_crew_id: crewId, assigned_crew: crewName ? { name: crewName } : null } : d
      )
    );
  }, [crewOptions]);

  return (
    <>
      <DeploymentsKanban
        deployments={deployments}
        onSelectDeployment={handleSelectDeployment}
        onMoveDeployment={handleMoveDeployment}
      />
      <DeploymentDetailPanel
        deploymentId={selectedId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStageChange={handleMoveDeployment}
        onCrewAssign={handleCrewAssign}
        crewOptions={crewOptions}
      />
    </>
  );
}
