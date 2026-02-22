'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  getBenchmarkSettings,
  getOrgBenchmarkMetrics,
  getBenchmarkAggregates,
  updateBenchmarkSettings,
} from '@/actions/benchmarking';
import { BarChart3, Lock, ShieldCheck } from 'lucide-react';

const SIZE_BUCKETS = ['1-10', '11-50', '51-200', '201+', 'unknown'];
const VERTICALS = ['medical', 'industrial', 'education', 'retail', 'other', 'unknown'];

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}
function fmtScore(v: number | null): string {
  if (v == null) return '—';
  return v.toFixed(1);
}

export function BenchmarkComparisonPanel({ orgId }: { orgId: string }) {
  const [settings, setSettings] = useState<{
    benchmarkingOptIn: boolean;
    companySizeBucket: string | null;
    vertical: string | null;
    error?: string;
  } | null>(null);
  const [metrics, setMetrics] = useState<{
    closeRate: number | null;
    inspectionScore: number | null;
    grossMargin: number | null;
    costPerSqft: number | null;
  } | null>(null);
  const [aggregates, setAggregates] = useState<
    Array<{
      companySizeBucket: string;
      vertical: string;
      avgCloseRate: number | null;
      avgInspectionScore: number | null;
      avgGrossMargin: number | null;
      avgCostPerSqft: number | null;
      orgCount: number;
      updatedAt: string;
    }>
  >([]);
  const [peerBucket, setPeerBucket] = useState<string>('');
  const [peerVertical, setPeerVertical] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBenchmarkSettings(orgId).then(setSettings);
  }, [orgId]);

  useEffect(() => {
    if (!settings?.benchmarkingOptIn) return;
    getOrgBenchmarkMetrics(orgId).then((r) => (r.error ? null : setMetrics({ closeRate: r.closeRate, inspectionScore: r.inspectionScore, grossMargin: r.grossMargin, costPerSqft: r.costPerSqft })));
    getBenchmarkAggregates().then((r) => (r.error ? [] : setAggregates(r.rows)));
  }, [orgId, settings?.benchmarkingOptIn]);

  useEffect(() => {
    if (settings?.companySizeBucket) setPeerBucket(settings.companySizeBucket);
    else if (aggregates.length) setPeerBucket(aggregates[0]?.companySizeBucket ?? '');
  }, [settings?.companySizeBucket, aggregates]);

  useEffect(() => {
    if (settings?.vertical) setPeerVertical(settings.vertical);
    else if (aggregates.length) setPeerVertical(aggregates[0]?.vertical ?? '');
  }, [settings?.vertical, aggregates]);

  const peerRow = aggregates.find((r) => r.companySizeBucket === peerBucket && r.vertical === peerVertical);

  const handleOptIn = async () => {
    setSaving(true);
    const { error } = await updateBenchmarkSettings(orgId, {
      benchmarkingOptIn: true,
      companySizeBucket: settings?.companySizeBucket ?? 'unknown',
      vertical: settings?.vertical ?? 'unknown',
    });
    setSaving(false);
    if (!error) getBenchmarkSettings(orgId).then(setSettings);
  };

  if (settings === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  if (!settings.benchmarkingOptIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Peer Benchmarking
          </CardTitle>
          <CardDescription>Compare your metrics to anonymized industry peers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Opt in to see benchmarks</p>
              <p className="text-sm text-amber-700 dark:text-amber-300/90 mt-1">
                Benchmarking is anonymous and optional. Only aggregated metrics (e.g. average close rate, inspection score) are shared—never your raw data or identity. 
                Opt in to compare your organization to peers by size and vertical.
              </p>
            </div>
          </div>
          <Button onClick={handleOptIn} disabled={saving}>
            {saving ? 'Saving…' : 'Opt in to benchmarking'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Benchmark comparison
        </CardTitle>
        <CardDescription>
          Your org vs anonymized peers. Data is aggregated only; no other organization’s raw data is ever shown.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Peer group: size</Label>
            <select
              className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={peerBucket}
              onChange={(e) => setPeerBucket(e.target.value)}
            >
              {SIZE_BUCKETS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Peer group: vertical</Label>
            <select
              className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={peerVertical}
              onChange={(e) => setPeerVertical(e.target.value)}
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Metric</th>
                <th className="text-right py-2 font-medium">Your org</th>
                <th className="text-right py-2 font-medium">Peers (avg)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">Close rate (90d)</td>
                <td className="text-right">{fmtPct(metrics?.closeRate ?? null)}</td>
                <td className="text-right">{peerRow ? fmtPct(peerRow.avgCloseRate) : '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Inspection score (90d)</td>
                <td className="text-right">{fmtScore(metrics?.inspectionScore ?? null)}</td>
                <td className="text-right">{peerRow ? fmtScore(peerRow.avgInspectionScore) : '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Gross margin %</td>
                <td className="text-right">{metrics?.grossMargin != null ? `${metrics.grossMargin.toFixed(1)}%` : '—'}</td>
                <td className="text-right">{peerRow?.avgGrossMargin != null ? `${peerRow.avgGrossMargin.toFixed(1)}%` : '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">Cost per sq ft</td>
                <td className="text-right">{metrics?.costPerSqft != null ? `$${metrics.costPerSqft.toFixed(2)}` : '—'}</td>
                <td className="text-right">{peerRow?.avgCostPerSqft != null ? `$${peerRow.avgCostPerSqft.toFixed(2)}` : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {peerRow && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Peer average based on {peerRow.orgCount} opted-in org(s). Updated {peerRow.updatedAt ? new Date(peerRow.updatedAt).toLocaleDateString() : ''}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
