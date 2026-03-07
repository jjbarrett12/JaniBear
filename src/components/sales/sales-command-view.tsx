'use client';

import Link from 'next/link';
import {
  DollarSign,
  FileText,
  Calendar,
  Target,
  AlertTriangle,
  Phone,
  Flame,
  PhoneCall,
  CalendarPlus,
  ArrowRight,
  Zap,
  UserPlus,
} from 'lucide-react';
import type { SalesCommandData, SalesCommandCardItem } from '@/lib/sales/sales-command-data';
import { SALES_COPY } from '@/lib/sales-module-copy';
import { GrizzlyModeStrip, GrizzlyPageStrap } from '@/components/sales/grizzly-mode-strip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

const KPI_CONFIG = [
  { key: 'pipelineValue' as const, label: SALES_COPY.kpi.pipelineValue, icon: DollarSign, href: '/app/crm/pipeline', variant: 'neutral' as const },
  { key: 'revenueLikelyThisMonth' as const, label: SALES_COPY.kpi.revenueLikelyThisMonth, icon: Target, href: '/app/crm/pipeline', variant: 'success' as const },
  { key: 'proposalValueOut' as const, label: SALES_COPY.kpi.proposalValueOut, icon: FileText, href: '/app/sales/proposals', variant: 'neutral' as const },
  { key: 'walkthroughsThisWeek' as const, label: SALES_COPY.kpi.walkthroughsThisWeek, icon: Calendar, href: '/app/sales/walkthroughs', variant: 'neutral' as const },
  { key: 'stalledDeals' as const, label: SALES_COPY.kpi.stalledDeals, icon: AlertTriangle, variant: 'warning' as const },
  { key: 'leadsRequiringTouchToday' as const, label: SALES_COPY.kpi.leadsRequiringTouchToday, icon: Phone, href: '/app/sales/leads?view=needs_follow_up', variant: 'danger' as const },
  { key: 'winRate' as const, label: SALES_COPY.kpi.winRate, icon: Target, href: '/app/crm/pipeline', variant: 'neutral' as const },
];

const KPI_VALUE_MAP: Record<string, (k: SalesCommandData['kpis']) => number | string> = {
  pipelineValue: (k) => k.pipelineValue,
  revenueLikelyThisMonth: (k) => k.dealsClosingThisMonth,
  proposalValueOut: (k) => k.proposalValueOut,
  walkthroughsThisWeek: (k) => k.walkthroughsThisWeek,
  stalledDeals: (k) => k.stalledDeals,
  leadsRequiringTouchToday: (k) => k.leadsRequiringTouchToday,
  winRate: (k) => k.winRate != null ? `${k.winRate}%` : '—',
};

function KpiCard({
  label,
  value,
  icon: Icon,
  href,
  variant,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  variant: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const displayValue = typeof value === 'number' && (label.toLowerCase().includes('value') || label.toLowerCase().includes('pipeline') || label.toLowerCase().includes('proposal'))
    ? formatCurrency(value)
    : String(value);
  const isUrgent = variant === 'warning' && value > 0 || variant === 'danger' && value > 0;
  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 min-h-[72px]',
        'bg-card/80 dark:bg-card/90 border-border',
        isUrgent && variant === 'warning' && 'dark:border-amber-500/25',
        isUrgent && variant === 'danger' && 'dark:border-rose-500/25',
        href && 'hover:border-primary/30 hover:bg-card'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          variant === 'danger' && 'bg-rose-500/15 text-rose-500',
          variant === 'warning' && 'bg-amber-500/15 text-amber-500',
          variant === 'success' && 'bg-emerald-500/15 text-emerald-500',
          variant === 'neutral' && 'bg-muted/80 text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</p>
        <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground truncate">{displayValue}</p>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ActionCard({ item }: { item: SalesCommandCardItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card/50 px-3 py-2.5',
        'hover:border-primary/25 hover:bg-card/80 transition-all duration-200'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground truncate">{item.title}</p>
        {item.subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.value != null && (
            <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 tabular-nums">{formatCurrency(item.value)}</span>
          )}
          {item.stage && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground uppercase tracking-wider">{item.stage.replace(/_/g, ' ')}</span>
          )}
          {item.score != null && (
            <span className="text-xs text-muted-foreground tabular-nums">Score {item.score}</span>
          )}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function WorkZone({
  title,
  description,
  icon: Icon,
  items,
  emptyMessage,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SalesCommandCardItem[];
  emptyMessage: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          </div>
        </div>
        <Link href={viewAllHref}>
          <Button variant="ghost" size="sm" className="text-xs h-8">
            {viewAllLabel}
          </Button>
        </Link>
      </div>
      <div className="flex-1 min-h-0 p-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">{emptyMessage}</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <ActionCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function SalesCommandView({ data }: { data: SalesCommandData }) {
  const { kpis, huntNow, bookWalkthroughs, moveDeals, closeRevenue, leaderboard, sourcePerformance, lostReasonSnapshot, recentWins, userName } = data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <header className="space-y-3">
        <GrizzlyModeStrip />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <GrizzlyPageStrap strap={SALES_COPY.command.strap} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl mt-0.5">
              {SALES_COPY.command.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {userName ? `${userName.split(' ')[0]} — ` : ''}{SALES_COPY.command.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/app/sales/leads/new">
              <Button size="sm" className="gap-2 h-9">
                <UserPlus className="h-4 w-4" />
                {SALES_COPY.command.addLead}
              </Button>
            </Link>
            <Link href="/app/sales/leads">
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Flame className="h-4 w-4" />
                {SALES_COPY.command.leads}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* KPI strip — compact cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-7" role="region" aria-label="Sales KPIs">
        {KPI_CONFIG.map(({ key, label, icon, href, variant }) => {
          const value = KPI_VALUE_MAP[key]?.(kpis) ?? 0;
          return (
            <KpiCard
              key={key}
              label={label}
              value={key === 'revenueLikelyThisMonth' ? value : value}
              icon={icon}
              href={href}
              variant={variant}
            />
          );
        })}
      </div>

      {/* Work zones — command layout */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        <WorkZone
          title={SALES_COPY.zones.huntNow.title}
          description={SALES_COPY.zones.huntNow.description}
          icon={PhoneCall}
          items={huntNow}
          emptyMessage={SALES_COPY.zones.huntNow.empty}
          viewAllHref="/app/sales/leads"
          viewAllLabel={SALES_COPY.zones.huntNow.viewAll}
        />
        <WorkZone
          title={SALES_COPY.zones.bookWalkthroughs.title}
          description={SALES_COPY.zones.bookWalkthroughs.description}
          icon={CalendarPlus}
          items={bookWalkthroughs}
          emptyMessage={SALES_COPY.zones.bookWalkthroughs.empty}
          viewAllHref="/app/sales/walkthroughs"
          viewAllLabel={SALES_COPY.zones.bookWalkthroughs.viewAll}
        />
        <WorkZone
          title={SALES_COPY.zones.moveDeals.title}
          description={SALES_COPY.zones.moveDeals.description}
          icon={ArrowRight}
          items={moveDeals}
          emptyMessage={SALES_COPY.zones.moveDeals.empty}
          viewAllHref="/app/crm/pipeline"
          viewAllLabel={SALES_COPY.zones.moveDeals.viewAll}
        />
        <WorkZone
          title={SALES_COPY.zones.closeRevenue.title}
          description={SALES_COPY.zones.closeRevenue.description}
          icon={Zap}
          items={closeRevenue}
          emptyMessage={SALES_COPY.zones.closeRevenue.empty}
          viewAllHref="/app/crm/pipeline"
          viewAllLabel={SALES_COPY.zones.closeRevenue.viewAll}
        />
      </div>

      {/* Bottom: Leaderboard, Source performance, Lost reason, Recent wins */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
        {leaderboard.length > 0 && (
          <section className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Rep leaderboard</h2>
              <p className="text-[11px] text-muted-foreground">Won revenue · win rate</p>
            </div>
            <div className="p-3">
              <ul className="space-y-2">
                {leaderboard.slice(0, 5).map((r) => (
                  <li key={r.repId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium tabular-nums text-muted-foreground w-5">#{r.rank}</span>
                    <span className="truncate flex-1">{r.repName ?? 'Unknown'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">{formatCurrency(r.wonRevenue)}</span>
                    {r.winRate != null && <span className="text-xs text-muted-foreground">{r.winRate}%</span>}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        {sourcePerformance.length > 0 && (
          <section className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Source performance</h2>
              <p className="text-[11px] text-muted-foreground">Leads by source</p>
            </div>
            <div className="p-3">
              <ul className="space-y-2">
                {sourcePerformance.slice(0, 5).map((s) => (
                  <li key={s.source} className="flex items-center justify-between gap-2 text-sm">
                    <span className="capitalize truncate">{s.source.replace(/_/g, ' ')}</span>
                    <span className="tabular-nums text-muted-foreground">{s.leadCount} leads</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        {lostReasonSnapshot.length > 0 && (
          <section className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Lost reason snapshot</h2>
              <p className="text-[11px] text-muted-foreground">Why deals were lost</p>
            </div>
            <div className="p-3">
              <ul className="space-y-2">
                {lostReasonSnapshot.map((r) => (
                  <li key={r.reason} className="flex items-center justify-between gap-2 text-sm">
                    <span className="capitalize">{r.reason.replace(/_/g, ' ')}</span>
                    <span className="tabular-nums text-muted-foreground">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
        {recentWins.length > 0 && (
          <section className="rounded-xl border border-border bg-card/80 dark:bg-card/90 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Recent wins</h2>
              <p className="text-[11px] text-muted-foreground">Closed revenue</p>
            </div>
            <div className="p-3">
              <ul className="space-y-1.5">
                {recentWins.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-center justify-between gap-2 text-sm hover:text-primary">
                      <span className="truncate">{item.title}</span>
                      {item.value != null && <span className="text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">{formatCurrency(item.value)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
