'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type OpsHealthStatus = 'healthy' | 'watch' | 'critical';

export interface OpsHealthSubmetric {
  label: string;
  valuePct: number;
  targetPct?: number;
  status?: OpsHealthStatus;
}

export interface OperationalHealthCompositeCardProps {
  score: number;
  status: OpsHealthStatus;
  submetrics: OpsHealthSubmetric[];
  onClick?: () => void;
}

function statusDotClass(status: OpsHealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-health-green';
    case 'watch':
      return 'bg-health-amber';
    case 'critical':
      return 'bg-health-red';
    default:
      return 'bg-muted-foreground';
  }
}

function progressClass(status?: OpsHealthStatus): string {
  switch (status) {
    case 'healthy':
      return '[&>div]:bg-health-green';
    case 'watch':
      return '[&>div]:bg-health-amber';
    case 'critical':
      return '[&>div]:bg-health-red';
    default:
      return '';
  }
}

export function OperationalHealthCompositeCard({
  score,
  status,
  submetrics,
  onClick,
}: OperationalHealthCompositeCardProps) {
  const display = submetrics.slice(0, 4);
  return (
    <Card
      className={cn(
        'transition-shadow border-l-[3px] border-l-border',
        status === 'critical' && 'border-l-red-500/50',
        status === 'watch' && 'border-l-amber-500/50',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Operational Health Score
          </span>
          <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', statusDotClass(status))} aria-hidden />
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-heading text-[22px] sm:text-[24px] font-bold text-foreground tabular-nums">
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
        {display.length > 0 && (
          <ul className="mt-3 space-y-2">
            {display.map((sm) => (
              <li key={sm.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground truncate">{sm.label}</span>
                  <span className="font-medium tabular-nums shrink-0">{sm.valuePct}%</span>
                </div>
                <Progress
                  value={Math.min(100, sm.valuePct)}
                  className={cn('h-1.5', progressClass(sm.status))}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
