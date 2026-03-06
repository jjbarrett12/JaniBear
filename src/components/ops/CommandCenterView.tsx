'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CommandCenterData } from '@/lib/ops/command-center-types';
import {
  AlertCircle,
  AlertTriangle,
  Users,
  UserCheck,
  ListChecks,
  Target,
  ChevronRight,
  Calendar,
  Search,
} from 'lucide-react';

interface Props {
  initialData: CommandCenterData;
  orgId: string;
  canWrite: boolean;
  searchParams: { date?: string; territoryId?: string; verticalId?: string; riskLevel?: string; search?: string };
}

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Operations Command Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live view of operational risk, staffing coverage, and recovery actions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={searchParams.date ?? today}
                onChange={(e) => setFilters({ date: e.target.value })}
                className="h-9 w-[140px]"
              />
            </div>
            <Select value={searchParams.territoryId ?? 'all'} onValueChange={(v) => setFilters({ territoryId: v === 'all' ? undefined : v })}>
              <SelectTrigger className="w-[180px] h-9">
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
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All verticals</SelectItem>
                {verticals.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[160px] max-w-[240px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Account / operator..."
                defaultValue={searchParams.search}
                onKeyDown={(e) => e.key === 'Enter' && setFilters({ search: (e.target as HTMLInputElement).value || undefined })}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coverage Gaps Tonight</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kpis.coverageGapsTonight}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">High Risk Accounts</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kpis.highRiskAccounts}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reliability Alerts</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kpis.reliabilityAlerts}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Backup Capacity</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kpis.backupCapacityAvailable}</p>
            </CardContent>
          </Card>
          {kpis.avgQcScore != null && (
            <Card className="bg-card hidden lg:block">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg QC Score</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.avgQcScore}</p>
              </CardContent>
            </Card>
          )}
          {kpis.missedTasksToday != null && (
            <Card className="bg-card hidden lg:block">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Missed Today</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.missedTasksToday}</p>
              </CardContent>
            </Card>
          )}
          {kpis.complaintsLast7Days != null && (
            <Card className="bg-card hidden lg:block">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Complaints (7d)</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpis.complaintsLast7Days}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Coverage Gaps */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Coverage Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {coverageGaps.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No shifts for this date.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coverageGaps.slice(0, 8).map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium text-sm">{g.account_name || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.start_time} – {g.end_time}</TableCell>
                        <TableCell>
                          <Badge
                            variant={g.coverage_status === 'coverage_needed' ? 'destructive' : g.coverage_status === 'backup_assigned' ? 'secondary' : 'outline'}
                            className="text-xs capitalize"
                          >
                            {g.coverage_status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {g.coverage_status === 'coverage_needed' && canWrite && (
                            <Link href={`/app/ops?highlight=coverage`}>
                              <Button size="sm" variant="outline">Assign</Button>
                            </Link>
                          )}
                          {g.coverage_status !== 'coverage_needed' && (
                            <Link href={`/app/accounts/${g.account_id}`}>
                              <Button size="sm" variant="ghost">View</Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Risk Accounts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                Risk Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {riskAccounts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No risk accounts.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riskAccounts.slice(0, 8).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{r.account_name || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs capitalize ${
                              r.risk_level === 'critical' ? 'bg-red-600' :
                              r.risk_level === 'high' ? 'bg-orange-500' :
                              r.risk_level === 'medium' ? 'bg-amber-500' : 'bg-muted'
                            }`}
                          >
                            {r.risk_level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[140px] truncate">{r.top_reason ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/app/ops/risk/${r.account_id}`}>
                            <Button size="sm" variant="outline">View risk</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Crew Reliability */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-500" />
                Crew Reliability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {reliabilityAlerts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No reliability data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operator</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead className="text-right">QC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reliabilityAlerts.slice(0, 8).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium text-sm">{r.operator_name}</TableCell>
                        <TableCell>
                          <span className={r.reliability_score < 50 ? 'text-red-600 font-medium' : r.reliability_score < 65 ? 'text-amber-600' : 'text-muted-foreground'}>
                            {r.reliability_score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs capitalize text-muted-foreground">{r.trend}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{r.qc_consistency_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Backup Pools */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-500" />
                Backup Pools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {backupPools.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No backup pools configured.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pool</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backupPools.slice(0, 8).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-sm">{p.available_tonight}</TableCell>
                        <TableCell>
                          <Badge
                            variant={p.coverage_health === 'healthy' ? 'default' : p.coverage_health === 'thin' ? 'secondary' : 'destructive'}
                            className="text-xs capitalize"
                          >
                            {p.coverage_health}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{p.avg_backup_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommended Actions Queue */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Recommended Actions
            </CardTitle>
            <p className="text-sm text-muted-foreground">Ranked by priority — fix what matters most first.</p>
          </CardHeader>
          <CardContent className="p-0">
            {recommendedActions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No recommended actions. You’re clear.</p>
            ) : (
              <ul className="divide-y">
                {recommendedActions.map((a, i) => (
                  <li key={`${a.entity_type}-${a.entity_id}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50">
                    <div className="flex items-start gap-3 min-w-0">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{a.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.subtitle}</p>
                        <p className="text-xs text-muted-foreground mt-1">{a.suggested_action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">P{a.priority}</Badge>
                      {a.type === 'coverage_gap' && canWrite && (
                        <Link href="/app/ops">
                          <Button size="sm" variant="outline">Assign backup</Button>
                        </Link>
                      )}
                      {a.type === 'risk_account' && (
                        <Link href={`/app/ops/risk/${a.account_id ?? a.entity_id}`}>
                          <Button size="sm" variant="ghost"><ChevronRight className="h-4 w-4" /></Button>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
