'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CommandCenterData, CoverageGapRow, RiskAccountRow, ReliabilityRow, BackupPoolRow, RecommendedAction } from '@/lib/ops/command-center-types';
import { OPS_COMMAND_COPY } from '@/lib/ops-command-copy';
import {
  AlertTriangle,
  Building2,
  Users,
  Activity,
  Truck,
  FileWarning,
  DollarSign,
  MapPin,
  ListChecks,
  ChevronRight,
  Calendar,
  Search,
  UserCheck,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  initialData: CommandCenterData;
  orgId: string;
  canWrite: boolean;
  searchParams: { date?: string; territoryId?: string; verticalId?: string; riskLevel?: string; search?: string };
}

type KpiId = 'active_accounts' | 'crews_today' | 'accounts_at_risk' | 'open_deployments' | 'sla_breaches' | 'revenue_today';

const KPI_CONFIG: Record<
  KpiId,
  { label: string; icon: React.ComponentType<{ className?: string }>; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'revenue' | 'cyan'; href?: string }
> = {
  active_accounts: { label: OPS_COMMAND_COPY.kpi.activeAccounts, icon: Building2, variant: 'neutral', href: '/app/accounts' },
  crews_today: { label: OPS_COMMAND_COPY.kpi.crewsScheduledToday, icon: Users, variant: 'success', href: '/app/crews' },
  accounts_at_risk: { label: OPS_COMMAND_COPY.kpi.accountsAtRisk, icon: Activity, variant: 'danger', href: '/app/ops/risk' },
  open_deployments: { label: OPS_COMMAND_COPY.kpi.openDeployments, icon: Truck, variant: 'warning', href: '/app/ops' },
  sla_breaches: { label: OPS_COMMAND_COPY.kpi.slaBreaches, icon: FileWarning, variant: 'danger', href: '/app/ops/issues-sla' },
  revenue_today: { label: OPS_COMMAND_COPY.kpi.revenueScheduledToday, icon: DollarSign, variant: 'revenue', href: '/app/financial-health' },
};

const CARD_STYLES = {
  neutral: 'bg-card dark:bg-card/90 border-border',
  success: 'bg-card dark:bg-card/90 border-border dark:border-emerald-500/20',
  warning: 'bg-card dark:bg-card/90 border-border dark:border-amber-500/20',
  danger: 'bg-card dark:bg-card/90 border-border dark:border-rose-500/20',
  revenue: 'bg-card dark:bg-card/90 border-border dark:border-indigo-500/20',
  cyan: 'bg-card dark:bg-card/90 border-border dark:border-cyan-500/20',
} as const;

const ACCENT_BAR = {
  neutral: 'bg-slate-500/60',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  revenue: 'bg-indigo-500',
  cyan: 'bg-cyan-500/80',
} as const;

const ICON_STYLES = {
  neutral: 'bg-muted/80 text-muted-foreground',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  revenue: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  cyan: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
} as const;

export function CommandCenterView({ initialData, orgId, canWrite, searchParams }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const today = new Date().toISOString().slice(0, 10);

  const setFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const date = updates.date ?? searchParams.date ?? today;
    const territoryId = updates.territoryId ?? searchParams.territoryId;
    const verticalId = updates.verticalId ?? searchParams.verticalId;
    const riskLevel = updates.riskLevel ?? searchParams.riskLevel;
    const search = updates.search ?? searchParams.search;
    params.set('date', date);
    if (territoryId) params.set('territoryId', territoryId);
    if (verticalId) params.set('verticalId', verticalId);
    if (riskLevel) params.set('riskLevel', riskLevel);
    if (search) params.set('search', search);
    router.push(`${pathname}?${params.toString()}`);
  };

  const { kpis, coverageGaps, riskAccounts, reliabilityAlerts, backupPools, recommendedActions, territories, verticals } = initialData;

  // Derived KPI values for the 6-tile strip
  const activeAccounts = new Set(coverageGaps.map((g) => g.account_id)).size;
  const crewsScheduledToday = coverageGaps.filter((g) => g.coverage_status !== 'coverage_needed').length;
  const accountsAtRisk = kpis.highRiskAccounts;
  const openDeployments = kpis.coverageGapsTonight;
  const slaBreaches = (kpis.missedTasksToday ?? 0) + (kpis.complaintsLast7Days ?? 0);
  const revenueScheduledToday: string | number = '—'; // not in ops API

  const kpiValues: Record<KpiId, string | number> = {
    active_accounts: activeAccounts,
    crews_today: crewsScheduledToday,
    accounts_at_risk: accountsAtRisk,
    open_deployments: openDeployments,
    sla_breaches: slaBreaches,
    revenue_today: revenueScheduledToday,
  };

  const actionCount = recommendedActions.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header band */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {OPS_COMMAND_COPY.header.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
                {OPS_COMMAND_COPY.header.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={searchParams.date ?? today}
                  onChange={(e) => setFilters({ date: e.target.value })}
                  className="h-9 w-[132px] bg-background/80 border-border"
                />
              </div>
              <Select value={searchParams.territoryId ?? 'all'} onValueChange={(v) => setFilters({ territoryId: v === 'all' ? undefined : v })}>
                <SelectTrigger className="w-[160px] h-9 border-border bg-background/80">
                  <SelectValue placeholder="Territory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All territories</SelectItem>
                  {territories.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={searchParams.verticalId ?? 'all'} onValueChange={(v) => setFilters({ verticalId: v === 'all' ? undefined : v })}>
                <SelectTrigger className="w-[140px] h-9 border-border bg-background/80">
                  <SelectValue placeholder="Vertical" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All verticals</SelectItem>
                  {verticals.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Account / operator…"
                  defaultValue={searchParams.search}
                  onKeyDown={(e) => e.key === 'Enter' && setFilters({ search: (e.target as HTMLInputElement).value || undefined })}
                  className="pl-8 h-9 border-border bg-background/80"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* KPI strip — 6 equal cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6" role="region" aria-label="Ops KPIs">
          {(Object.keys(KPI_CONFIG) as KpiId[]).map((id) => {
            const config = KPI_CONFIG[id];
            const value = kpiValues[id];
            const Icon = config.icon;
            const href = config.href;
            const Wrapper = href ? Link : 'div';
            const wrapperProps = href ? { href } : {};
            return (
              <Wrapper
                key={id}
                {...wrapperProps}
                className={cn(
                  'relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 min-h-[108px]',
                  'hover:border-primary/20 dark:hover:border-primary/25 hover:shadow-sm',
                  CARD_STYLES[config.variant],
                  href && 'cursor-pointer'
                )}
              >
                <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', ACCENT_BAR[config.variant])} aria-hidden />
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', ICON_STYLES[config.variant])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                    {config.label}
                  </span>
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                  {value}
                </p>
              </Wrapper>
            );
          })}
        </div>

        {/* Requires Action rail */}
        <section
          className={cn(
            'flex items-center justify-between gap-4 w-full rounded-xl border px-4 py-2.5 transition-all duration-200',
            actionCount > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 hover:bg-amber-500/15 hover:border-amber-500/40'
              : 'border-border bg-muted/30 text-muted-foreground dark:bg-muted/20'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
            <span className="font-medium">
              {actionCount > 0 ? OPS_COMMAND_COPY.actionRail.withCount(actionCount) : OPS_COMMAND_COPY.actionRail.empty}
            </span>
          </div>
          {actionCount > 0 && (
            <a
              href="#action-queue"
              className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline shrink-0"
            >
              {OPS_COMMAND_COPY.actionRail.viewQueue}
              <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </section>

        {/* Main command grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-12">
          {/* Left: Territory Coverage (large) */}
          <div className="lg:col-span-5">
            <OpsPanel
              title={OPS_COMMAND_COPY.panels.territoryCoverage.title}
              description={OPS_COMMAND_COPY.panels.territoryCoverage.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/map?ops=true">{OPS_COMMAND_COPY.panels.territoryCoverage.action}</Link>
                </Button>
              }
              accent="cyan"
            >
              <div className="flex flex-col items-center justify-center min-h-[220px] rounded-xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">{OPS_COMMAND_COPY.panels.territoryCoverage.empty}</p>
                <p className="text-xs mt-0.5">{OPS_COMMAND_COPY.panels.territoryCoverage.emptyHint}</p>
              </div>
            </OpsPanel>
          </div>

          {/* Center + Right: 2x2 */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Center top: Live Deployments */}
              <OpsPanel
                title={OPS_COMMAND_COPY.panels.liveDeployments.title}
                description={OPS_COMMAND_COPY.panels.liveDeployments.description}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/ops">{OPS_COMMAND_COPY.panels.liveDeployments.action}</Link>
                  </Button>
                }
                accent="indigo"
              >
                <LiveDeploymentsList gaps={coverageGaps} canWrite={canWrite} />
              </OpsPanel>

              {/* Right top: Crew Capacity */}
              <OpsPanel
                title={OPS_COMMAND_COPY.panels.crewCapacity.title}
                description={OPS_COMMAND_COPY.panels.crewCapacity.description}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/crews">{OPS_COMMAND_COPY.panels.crewCapacity.action}</Link>
                  </Button>
                }
                accent="emerald"
              >
                <CrewCapacityList pools={backupPools} reliability={reliabilityAlerts} />
              </OpsPanel>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Center bottom: Account Health Watchlist */}
              <OpsPanel
                title={OPS_COMMAND_COPY.panels.accountHealthWatchlist.title}
                description={OPS_COMMAND_COPY.panels.accountHealthWatchlist.description}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/ops/risk">{OPS_COMMAND_COPY.panels.accountHealthWatchlist.action}</Link>
                  </Button>
                }
                accent="rose"
              >
                <AccountHealthWatchlistList accounts={riskAccounts} />
              </OpsPanel>

              {/* Right bottom: Upcoming Go-Lives */}
              <OpsPanel
                title={OPS_COMMAND_COPY.panels.upcomingGoLives.title}
                description={OPS_COMMAND_COPY.panels.upcomingGoLives.description}
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/app/ops/launch-intake">{OPS_COMMAND_COPY.panels.upcomingGoLives.action}</Link>
                  </Button>
                }
                accent="cyan"
              >
                <UpcomingGoLivesEmpty />
              </OpsPanel>
            </div>
          </div>
        </div>

        {/* Recommended Actions (full-width queue) */}
        {recommendedActions.length > 0 && (
          <section id="action-queue" className="rounded-xl border border-border bg-card dark:bg-card/90 overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-amber-500" />
                  {OPS_COMMAND_COPY.actionRail.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">Ranked by priority — address highest impact first.</p>
              </div>
            </div>
            <ul className="divide-y divide-border">
              {recommendedActions.map((a, i) => (
                <ActionQueueItem key={`${a.entity_type}-${a.entity_id}-${i}`} action={a} canWrite={canWrite} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function OpsPanel({
  title,
  description,
  action,
  children,
  accent = 'neutral',
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  accent?: 'neutral' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
}) {
  const borderAccent =
    accent === 'indigo' ? 'dark:border-indigo-500/20' :
    accent === 'emerald' ? 'dark:border-emerald-500/20' :
    accent === 'amber' ? 'dark:border-amber-500/20' :
    accent === 'rose' ? 'dark:border-rose-500/20' :
    accent === 'cyan' ? 'dark:border-cyan-500/20' : '';
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card dark:bg-card/90 overflow-hidden flex flex-col min-h-0',
        borderAccent
      )}
    >
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h2>
          {description && <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex-1 min-h-0 p-4 overflow-auto">{children}</div>
    </section>
  );
}

function LiveDeploymentsList({ gaps, canWrite }: { gaps: CoverageGapRow[]; canWrite: boolean }) {
  if (gaps.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{OPS_COMMAND_COPY.panels.liveDeployments.empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {gaps.slice(0, 6).map((g) => (
        <li key={g.id}>
          <Link
            href={g.coverage_status === 'coverage_needed' && canWrite ? '/app/ops?highlight=coverage' : `/app/accounts/${g.account_id}`}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/50 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <span className="font-medium text-foreground truncate block">{g.account_name || '—'}</span>
              <span className="text-xs text-muted-foreground">{g.start_time} – {g.end_time}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge
                variant={g.coverage_status === 'coverage_needed' ? 'destructive' : g.coverage_status === 'backup_assigned' ? 'secondary' : 'outline'}
                className="text-[10px] uppercase tracking-wider"
              >
                {g.coverage_status.replace('_', ' ')}
              </Badge>
              {g.coverage_status === 'coverage_needed' && canWrite && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Assign</span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AccountHealthWatchlistList({ accounts }: { accounts: RiskAccountRow[] }) {
  if (accounts.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{OPS_COMMAND_COPY.panels.accountHealthWatchlist.empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {accounts.slice(0, 5).map((r) => (
        <li key={r.id}>
          <Link
            href={`/app/ops/risk/${r.account_id}`}
            className="flex items-center justify-between gap-3 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm hover:bg-rose-500/10 transition-colors"
          >
            <div className="min-w-0">
              <span className="font-medium text-foreground truncate block">{r.account_name || '—'}</span>
              <span className="text-xs text-muted-foreground truncate block">{r.top_reason ?? '—'}</span>
            </div>
            <Badge
              className={cn(
                'text-[10px] uppercase shrink-0',
                r.risk_level === 'critical' && 'bg-rose-600 text-white border-0',
                r.risk_level === 'high' && 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-0',
                r.risk_level === 'medium' && 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-0',
                r.risk_level === 'low' && 'bg-muted text-muted-foreground'
              )}
            >
              {r.risk_level}
            </Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CrewCapacityList({ pools, reliability }: { pools: BackupPoolRow[]; reliability: ReliabilityRow[] }) {
  const hasPools = pools.length > 0;
  const hasReliability = reliability.length > 0;
  if (!hasPools && !hasReliability) {
    return <p className="text-sm text-muted-foreground py-4">{OPS_COMMAND_COPY.panels.crewCapacity.empty}</p>;
  }
  return (
    <div className="space-y-3">
      {pools.slice(0, 3).map((p) => (
        <Link
          key={p.id}
          href="/app/ops"
          className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
        >
          <span className="font-medium text-foreground truncate">{p.name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{p.available_tonight} avail</span>
            <Badge
              variant={p.coverage_health === 'healthy' ? 'default' : p.coverage_health === 'thin' ? 'secondary' : 'destructive'}
              className="text-[10px]"
            >
              {p.coverage_health}
            </Badge>
          </div>
        </Link>
      ))}
      {reliability.slice(0, 2).map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm"
        >
          <span className="font-medium text-foreground truncate">{r.operator_name}</span>
          <span className={cn('text-xs font-medium tabular-nums shrink-0', r.reliability_score < 50 ? 'text-rose-600 dark:text-rose-400' : r.reliability_score < 65 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
            {r.reliability_score}
          </span>
        </div>
      ))}
    </div>
  );
}

function UpcomingGoLivesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[120px] rounded-xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground">
      <Rocket className="h-8 w-8 mb-1.5 opacity-50" />
      <p className="text-sm">{OPS_COMMAND_COPY.panels.upcomingGoLives.empty}</p>
      <Link href="/app/ops/launch-intake" className="text-xs font-medium text-primary mt-1 hover:underline">
        {OPS_COMMAND_COPY.panels.upcomingGoLives.action}
      </Link>
    </div>
  );
}

function ActionQueueItem({ action, canWrite }: { action: RecommendedAction; canWrite: boolean }) {
  return (
    <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm text-foreground">{action.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
          <p className="text-xs text-muted-foreground/80 mt-0.5">{action.suggested_action}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="text-[10px] font-medium">
          P{action.priority}
        </Badge>
        {action.type === 'coverage_gap' && canWrite && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/app/ops">Assign</Link>
          </Button>
        )}
        {action.type === 'risk_account' && (
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/app/ops/risk/${action.account_id ?? action.entity_id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </li>
  );
}
