'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { AlertTriangle, ArrowRightCircle, Users, FileCheck, TrendingDown, Zap } from 'lucide-react';
import type { AttentionAlert } from '@/lib/kpi-metrics';
import { mapAttentionStripItems } from '@/lib/kpi-dashboard-adapter';
import { cn } from '@/lib/utils';

export interface RiskAndAttentionSectionProps {
  alerts: AttentionAlert[];
}

/** Maps alert ids to Risk categories: accounts deteriorating, opportunities stalled 30+, SLA breaches, inspection score drops */
function categorizeAlert(id: string): 'accounts' | 'opportunities' | 'sla' | 'inspection' | 'other' {
  if (id.includes('account') || id.includes('threshold') || id.includes('nps')) return 'accounts';
  if (id.includes('opps') || id.includes('stalled')) return 'opportunities';
  if (id.includes('sla') || id.includes('issues_past')) return 'sla';
  if (id.includes('inspection') || id.includes('contracts_not_inspected')) return 'inspection';
  return 'other';
}

const RISK_LABELS: Record<'accounts' | 'opportunities' | 'sla' | 'inspection', string> = {
  accounts: 'Accounts deteriorating',
  opportunities: 'Opportunities stalled 30+ days',
  sla: 'SLA breaches',
  inspection: 'Inspection score drops',
};

const RISK_ICONS: Record<'accounts' | 'opportunities' | 'sla' | 'inspection', React.ComponentType<{ className?: string }>> = {
  accounts: TrendingDown,
  opportunities: FileCheck,
  sla: AlertTriangle,
  inspection: FileCheck,
};

export function RiskAndAttentionSection({ alerts }: RiskAndAttentionSectionProps) {
  const items = mapAttentionStripItems(alerts);
  const byCategory: Record<string, { count: number; href?: string }> = {};
  items.forEach((i) => {
    const cat = categorizeAlert(i.id);
    if (cat === 'other') return;
    const key = cat;
    if (!byCategory[key]) byCategory[key] = { count: 0 };
    byCategory[key].count += i.count;
    const alert = alerts.find((a) => a.id === i.id);
    if (alert?.href) byCategory[key].href = alert.href;
  });

  const riskRows: { key: 'accounts' | 'opportunities' | 'sla' | 'inspection'; count: number; href?: string }[] = [
    { key: 'accounts', count: byCategory.accounts?.count ?? 0, href: byCategory.accounts?.href ?? '/app/accounts?filter=below_threshold' },
    { key: 'opportunities', count: byCategory.opportunities?.count ?? 0, href: byCategory.opportunities?.href ?? '/app/crm/pipeline' },
    { key: 'sla', count: byCategory.sla?.count ?? 0, href: byCategory.sla?.href ?? '/app/issues' },
    { key: 'inspection', count: byCategory.inspection?.count ?? 0, href: '/app/inspections' },
  ];

  const quickActions = [
    { label: 'View at-risk accounts', href: '/app/accounts?filter=below_threshold', icon: Users },
    { label: 'Pipeline (stalled opps)', href: '/app/crm/pipeline', icon: FileCheck },
    { label: 'Open issues / SLA', href: '/app/issues', icon: AlertTriangle },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-8">
        <Card className="border-border h-full">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Risk & Attention
            </h3>
            <ul className="mt-3 space-y-2">
              {riskRows.map(({ key, count, href }) => {
                const Icon = RISK_ICONS[key];
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                        count > 0 ? 'bg-muted/50 hover:bg-muted text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        {RISK_LABELS[key]}
                      </span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-4">
        <Card className="border-border h-full">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Actions
            </h3>
            <div className="mt-3 space-y-2">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </span>
                  <ArrowRightCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
