'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBearScoreHealth } from '@/lib/financial-health';

interface BearHealthScoreProps {
  score: number;
  topDrivers: { label: string; impact: string; action: string }[];
}

const RADIUS = 64;
const STROKE = 10;
const circumference = 2 * Math.PI * (RADIUS - STROKE / 2);

export function BearHealthScore({ score, topDrivers }: BearHealthScoreProps) {
  const health = getBearScoreHealth(score);
  const dashOffset = circumference - (score / 100) * circumference;
  const strokeColor =
    health === 'green'
      ? 'hsl(var(--health-green))'
      : health === 'amber'
        ? 'hsl(var(--health-amber))'
        : 'hsl(var(--health-red))';

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Bear Health Score</CardTitle>
        <p className="text-xs text-muted-foreground">
          80–100 Healthy | 60–79 Watch | 0–59 At Risk
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="relative inline-flex items-center justify-center">
            <svg width={RADIUS * 2} height={RADIUS * 2} className="-rotate-90">
              <circle
                cx={RADIUS}
                cy={RADIUS}
                r={RADIUS - STROKE / 2}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={STROKE}
              />
              <circle
                cx={RADIUS}
                cy={RADIUS}
                r={RADIUS - STROKE / 2}
                fill="none"
                stroke={strokeColor}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute font-heading text-2xl font-bold tabular-nums text-foreground">
              {score}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${
              health === 'green' ? 'text-health-green' : health === 'amber' ? 'text-health-amber' : 'text-health-red'
            }`}>
              {health === 'green' ? 'Healthy' : health === 'amber' ? 'Watch' : 'At Risk'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Top drivers hurting your score</p>
            <ul className="mt-2 space-y-1.5">
              {topDrivers.slice(0, 3).map((d, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium text-foreground">{d.label}</span>
                  <span className="text-muted-foreground"> — {d.action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
