'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ServiceDeploymentRow } from '@/lib/service-deployments/types';
import { DEPLOYMENT_TYPE_LABELS, STAGE_LABELS } from '@/lib/service-deployments/types';
import type { DeploymentStage, DeploymentType } from '@/lib/service-deployments/types';
import { format } from 'date-fns';
import { Building2, User, Calendar, Users } from 'lucide-react';

const TYPE_ACCENT: Record<DeploymentType, string> = {
  new_account: 'border-l-emerald-500/60',
  crew_reassignment: 'border-l-blue-500/60',
  scope_change: 'border-l-amber-500/60',
  franchise_transfer: 'border-l-violet-500/60',
  service_restart: 'border-l-slate-500/60',
};

export interface DeploymentCardProps {
  deployment: ServiceDeploymentRow;
  onClick: () => void;
  isDragging?: boolean;
  className?: string;
}

function getAccountName(row: ServiceDeploymentRow): string {
  if (row.account?.name) return row.account.name;
  return 'Unknown account';
}

function getCrewName(row: ServiceDeploymentRow): string | null {
  if (row.assigned_crew?.name) return row.assigned_crew.name;
  return null;
}

function getRequestedByName(row: ServiceDeploymentRow): string {
  if (row.requested_by_profile?.full_name) return row.requested_by_profile.full_name;
  return 'Unknown';
}

export function DeploymentCard({
  deployment,
  onClick,
  isDragging,
  className,
}: DeploymentCardProps) {
  const accountName = getAccountName(deployment);
  const crewName = getCrewName(deployment);
  const requestedBy = getRequestedByName(deployment);
  const requestedAt = deployment.requested_at
    ? format(new Date(deployment.requested_at), 'MMM d, yyyy')
    : '—';
  const typeLabel = DEPLOYMENT_TYPE_LABELS[deployment.deployment_type as DeploymentType];
  const stageLabel = STAGE_LABELS[deployment.stage as DeploymentStage];
  const accent = TYPE_ACCENT[deployment.deployment_type as DeploymentType];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={cn(
        'relative rounded-xl border border-border bg-card text-left shadow-sm transition-all',
        'hover:border-slate-500/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'cursor-pointer',
        accent && `border-l-4 ${accent}`,
        isDragging && 'opacity-70 shadow-lg',
        className
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              {accountName}
            </p>
            <Badge variant="secondary" className="mt-1 text-xs font-medium">
              {typeLabel}
            </Badge>
          </div>
        </div>
        {deployment.reason && (
          <p className="text-sm text-muted-foreground line-clamp-2">{deployment.reason}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {requestedBy}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {requestedAt}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">{stageLabel}</span>
          {crewName && (
            <span className="flex items-center gap-1 text-xs font-medium text-foreground">
              <Users className="h-3.5 w-3.5" />
              {crewName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
