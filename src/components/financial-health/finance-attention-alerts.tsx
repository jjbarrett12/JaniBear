'use client';

import type { FinanceAttentionAlert } from '@/lib/financial-health-mock';
import { AlertTriangle } from 'lucide-react';

const SEVERITY_STYLES: Record<
  FinanceAttentionAlert['severity'],
  { bg: string; border: string; text: string }
> = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/60', text: 'text-red-800 dark:text-red-200' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/60', text: 'text-amber-800 dark:text-amber-200' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/60', text: 'text-yellow-800 dark:text-yellow-200' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/60', text: 'text-blue-800 dark:text-blue-200' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/60', text: 'text-purple-800 dark:text-purple-200' },
};

interface FinanceAttentionAlertsProps {
  alerts: FinanceAttentionAlert[];
  onAlertClick?: (alert: FinanceAttentionAlert) => void;
}

export function FinanceAttentionAlerts({ alerts, onAlertClick }: FinanceAttentionAlertsProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Attention Required
      </h3>
      <div className="flex flex-col gap-2">
        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity];
          const content = (
            <div
              className={`rounded-lg border px-3 py-2 ${style.bg} ${style.border} ${style.text} ${
                onAlertClick || alert.href ? 'cursor-pointer hover:opacity-90' : ''
              }`}
              onClick={() => (alert.href ? undefined : onAlertClick?.(alert))}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && (onAlertClick || alert.href)) {
                  e.preventDefault();
                  if (alert.href) window.location.hash = alert.href.replace('#', '');
                  else onAlertClick?.(alert);
                }
              }}
              role={onAlertClick || alert.href ? 'button' : undefined}
              tabIndex={onAlertClick || alert.href ? 0 : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{alert.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {alert.count}
                  {alert.amount != null ? ` · $${(alert.amount / 1000).toFixed(1)}k` : ''}
                </span>
              </div>
            </div>
          );
          if (alert.href) {
            return (
              <a key={alert.id} href={alert.href} className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                {content}
              </a>
            );
          }
          return <div key={alert.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
