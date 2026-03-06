'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, AlertCircle, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Hint } from '@/components/ui/hint';

interface AuditIssue {
  row_index: number;
  severity: 'error' | 'warning';
  field: string;
  code: string;
  message: string;
}

interface MigrationAuditSummary {
  customers_found: number;
  buildings_found: number;
  operators_found: number;
  schedule_rows_recognized: number;
  rows_ready_to_import: number;
  rows_needing_review: number;
  total_rows: number;
}

interface MigrationAuditResult {
  summary: MigrationAuditSummary;
  issues: AuditIssue[];
  readiness_score_pct: number;
  warning_count: number;
  error_count: number;
  ready_row_indices: number[];
}

interface PreviewRow {
  row_index: number;
  customer: string;
  building: string;
  address: string;
  service_schedule_raw: string;
  operator_name: string;
}

interface CommandCenterData {
  audit: MigrationAuditResult;
  detection: { platform: string; confidence: number; matched_headers: string[] };
  previewRows: PreviewRow[];
  rowCount: number;
  analysisDurationMs: number;
  mapping: Record<string, string>;
  columns: string[];
}

interface Props {
  batchId: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  jobber: 'Jobber Export',
  zenmaid: 'ZenMaid Export',
  swept: 'Swept Export',
  generic_spreadsheet: 'Generic spreadsheet',
};

/** Issue code → friendly label for "Issues We Caught" (e.g. "6 duplicate addresses") */
const ISSUE_CODE_TO_LABEL: Record<string, string> = {
  duplicate_building: 'duplicate addresses',
  duplicate_customer: 'duplicate customers',
  ambiguous_schedule: 'ambiguous schedules',
  unsupported_schedule: 'unsupported schedules',
  missing_customer_name: 'rows missing customer name',
  uncertain_operator: 'uncertain operator values',
  missing_building_and_address: 'rows missing building or address',
  weak_address: 'weak address data',
  blank_row: 'blank rows',
};

export function ImportConfirmClient({ batchId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [expandedIssueGroups, setExpandedIssueGroups] = useState<Set<string>>(new Set());
  const [expandByRow, setExpandByRow] = useState(false);
  const [platformOverride, setPlatformOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!batchId) {
      setError('Missing batch');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/onboarding/import/command-center', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to load');
        }
        const payload: CommandCenterData = await res.json();
        setData(payload);
        setMapping(payload.mapping ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  const toggleIssueGroup = (code: string) => {
    setExpandedIssueGroups((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  async function handlePlatformOverride(value: string) {
    setPlatformOverride(value);
    if (!data?.columns?.length || value === 'generic_spreadsheet') return;
    try {
      const res = await fetch('/api/onboarding/import/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: data.columns, overridePlatform: value }),
      });
      if (!res.ok) return;
      const d = await res.json();
      const template = (d.suggested_mapping ?? {}) as Record<string, string>;
      setMapping((prev) => ({ ...prev, ...template }));
    } catch {
      // ignore
    }
  }

  async function handleImport(mode: 'all' | 'ready_only') {
    if (!batchId) return;
    setImporting(true);
    setError(null);
    try {
      const body: { batchId: string; mapping: Record<string, string>; includeRowIndices?: number[] } = {
        batchId,
        mapping,
      };
      if (mode === 'ready_only' && data?.audit?.ready_row_indices?.length) {
        body.includeRowIndices = data.audit.ready_row_indices;
      }
      const res = await fetch('/api/onboarding/import/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? 'Import failed');
      const q = new URLSearchParams({ batchId });
      for (const [k, v] of Object.entries(result)) {
        if (typeof v === 'number' || typeof v === 'string') q.set(k, String(v));
      }
      router.push(`/onboarding/import/done?${q.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="text-sm text-slate-600">Preparing your migration…</span>
      </div>
    );
  }
  if (error || !batchId) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700" role="alert">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error ?? 'Missing batch'}
      </div>
    );
  }

  if (!data) return null;

  const { audit, detection, previewRows, rowCount, analysisDurationMs } = data;
  const s = audit.summary;
  const effectivePlatform = platformOverride ?? detection.platform;
  const readySet = new Set(audit.ready_row_indices);

  const analysisMessage =
    analysisDurationMs != null && analysisDurationMs >= 0
      ? analysisDurationMs < 1000
        ? `Analyzed ${rowCount} row${rowCount !== 1 ? 's' : ''} in ${analysisDurationMs} ms`
        : `Analyzed ${rowCount} row${rowCount !== 1 ? 's' : ''} in ${(analysisDurationMs / 1000).toFixed(1)} seconds`
      : null;

  // Group issues by code and build friendly labels: "6 duplicate addresses", "3 ambiguous schedules"
  const issuesByCode = audit.issues.reduce(
    (acc, i) => {
      const label = ISSUE_CODE_TO_LABEL[i.code] ?? i.code.replace(/_/g, ' ');
      if (!acc[label]) acc[label] = [];
      acc[label].push(i);
      return acc;
    },
    {} as Record<string, AuditIssue[]>
  );
  const issueEntries = Object.entries(issuesByCode).map(([label, issues]) => ({
    label: `${issues.length} ${label}`,
    count: issues.length,
    issues,
  }));

  const hasReadyOnly = audit.ready_row_indices.length > 0 && s.rows_needing_review > 0;
  const readinessPct = Math.min(100, audit.readiness_score_pct);
  const confidencePct = Math.round((platformOverride ? 1 : detection.confidence) * 100);
  const hasErrors = audit.error_count > 0;
  const hasWarnings = audit.warning_count > 0;

  // Rows with at least one issue, for "Review by row" table (row_index -> issues)
  const issuesByRow = audit.issues.reduce(
    (acc, issue) => {
      if (!acc[issue.row_index]) acc[issue.row_index] = [];
      acc[issue.row_index].push(issue);
      return acc;
    },
    {} as Record<number, AuditIssue[]>
  );
  const rowIndicesWithIssues = Object.keys(issuesByRow)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Migration Command Center
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          Professional migration overview before importing. Review readiness, data detected, and any issues below.
        </p>
        {analysisMessage && (
          <p className="text-sm text-slate-500 font-medium">
            {analysisMessage}
          </p>
        )}
      </header>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Migration audit summary
          </CardTitle>
          <Hint className="mt-1.5">Rows marked for review need your confirmation; only rows with errors are skipped.</Hint>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span className="text-4xl font-semibold tabular-nums tracking-tight text-slate-900">
              {readinessPct}%
            </span>
            <div className="text-sm text-slate-600 space-y-0.5">
              <p>
                <span className="font-semibold text-slate-800">{s.rows_ready_to_import}</span> rows ready to import
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-medium text-slate-700">{s.rows_needing_review}</span> need review
              </p>
              {(hasErrors || hasWarnings) && (
                <p className="text-slate-500">
                  {hasErrors && (
                    <span><span className="font-medium text-red-600">{audit.error_count}</span> error{audit.error_count !== 1 ? 's' : ''} (rows skipped)</span>
                  )}
                  {hasErrors && hasWarnings && ' · '}
                  {hasWarnings && (
                    <span><span className="font-medium text-amber-600">{audit.warning_count}</span> warning{audit.warning_count !== 1 ? 's' : ''}</span>
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-700 transition-all duration-500 ease-out"
              style={{ width: `${readinessPct}%` }}
              role="progressbar"
              aria-valuenow={readinessPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {hasErrors && (
            <p className="text-sm text-slate-600 rounded-lg bg-slate-50 px-3 py-2">
              Rows with errors will be skipped when you run import. Use <strong>Import ready rows only</strong> to import only problem-free rows, or fix your file and re-upload.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-medium text-slate-500 mb-3">Data detected</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{s.customers_found}</p>
              <p className="text-xs text-slate-500 mt-1">Customers detected</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{s.buildings_found}</p>
              <p className="text-xs text-slate-500 mt-1">Buildings detected</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{s.operators_found}</p>
              <p className="text-xs text-slate-500 mt-1">Operators detected</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <CardContent className="pt-5 pb-5">
              <p className="text-2xl font-semibold tabular-nums text-slate-900">{s.schedule_rows_recognized}</p>
              <p className="text-xs text-slate-500 mt-1">Service schedules detected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Detected import type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800">
              <FileSpreadsheet className="h-4 w-4 text-slate-500" />
              {PLATFORM_LABELS[effectivePlatform] ?? effectivePlatform}
            </span>
            {effectivePlatform !== 'generic_spreadsheet' && (
              <span className="text-sm text-slate-600">
                Confidence: {confidencePct}%
              </span>
            )}
          </div>
          {effectivePlatform !== 'generic_spreadsheet' && (
            <p className="text-sm text-slate-600">
              We recognized this export and configured the migration automatically.
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-sm text-slate-500">Override:</span>
            <Select value={effectivePlatform} onValueChange={handlePlatformOverride}>
              <SelectTrigger className="w-[200px] rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generic_spreadsheet">{PLATFORM_LABELS.generic_spreadsheet}</SelectItem>
                <SelectItem value="jobber">{PLATFORM_LABELS.jobber}</SelectItem>
                <SelectItem value="zenmaid">{PLATFORM_LABELS.zenmaid}</SelectItem>
                <SelectItem value="swept">{PLATFORM_LABELS.swept}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {issueEntries.length > 0 && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Issues we caught
            </CardTitle>
            <Hint className="mt-1.5">Warnings are suggestions, not errors; only errors cause rows to be skipped.</Hint>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => setExpandByRow(!expandByRow)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50/80 transition-colors"
            >
              <span>{expandByRow ? 'Hide row-by-row table' : 'Review by row'}</span>
              {expandByRow ? (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>
            {expandByRow && rowIndicesWithIssues.length > 0 && (
              <div className="overflow-x-auto max-h-[280px] overflow-y-auto rounded-lg border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 bg-slate-50/90">
                      <TableHead className="w-14 text-slate-600 font-medium">Row</TableHead>
                      <TableHead className="text-slate-600 font-medium">Customer</TableHead>
                      <TableHead className="text-slate-600 font-medium">Building</TableHead>
                      <TableHead className="text-slate-600 font-medium">Issues</TableHead>
                      <TableHead className="w-20 text-slate-600 font-medium">Severity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rowIndicesWithIssues.map((rowIdx) => {
                      const row = previewRows.find((r) => r.row_index === rowIdx);
                      const rowIssues = issuesByRow[rowIdx] ?? [];
                      const hasError = rowIssues.some((i) => i.severity === 'error');
                      return (
                        <TableRow
                          key={rowIdx}
                          className={hasError ? 'bg-red-50/50 border-slate-100' : 'bg-amber-50/30 border-slate-100'}
                        >
                          <TableCell className="font-mono text-xs text-slate-600">{rowIdx + 1}</TableCell>
                          <TableCell className="max-w-[140px] truncate text-sm text-slate-800" title={row?.customer}>
                            {row?.customer || '—'}
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-sm text-slate-800" title={row?.building}>
                            {row?.building || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600 max-w-[240px]">
                            <ul className="list-disc list-inside space-y-0.5">
                              {rowIssues.slice(0, 3).map((issue, idx) => (
                                <li key={idx}>{issue.message}</li>
                              ))}
                              {rowIssues.length > 3 && (
                                <li className="text-slate-500">+{rowIssues.length - 3} more</li>
                              )}
                            </ul>
                          </TableCell>
                          <TableCell>
                            {hasError ? (
                              <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">Error</span>
                            ) : (
                              <span className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">Warning</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-slate-500">Grouped by issue type:</p>
            <div className="space-y-1">
              {issueEntries.map(({ label, issues }) => {
                const isExpanded = expandedIssueGroups.has(label);
                return (
                  <div key={label} className="rounded-lg border border-slate-100 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleIssueGroup(label)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50/80 transition-colors"
                    >
                      <span className="font-medium">{label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                        <p className="text-xs font-medium text-slate-500 mb-1.5">Affected rows</p>
                        <p className="text-sm text-slate-600">
                          Rows {[...new Set(issues.map((i) => i.row_index + 1))].sort((a, b) => a - b).join(', ')}
                        </p>
                        <ul className="mt-2 list-inside list-disc text-sm text-slate-600 space-y-0.5">
                          {issues.slice(0, 5).map((issue, idx) => (
                            <li key={idx}>{issue.message}</li>
                          ))}
                          {issues.length > 5 && (
                            <li className="text-slate-500">… and {issues.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Data preview
          </CardTitle>
          <Hint className="mt-1">
            Rows needing review are highlighted. They aren’t wrong — they just need confirmation before import.
          </Hint>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[320px] overflow-y-auto rounded-b-xl">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="w-12 text-slate-600 font-medium">#</TableHead>
                  <TableHead className="text-slate-600 font-medium">Customer</TableHead>
                  <TableHead className="text-slate-600 font-medium">Building</TableHead>
                  <TableHead className="text-slate-600 font-medium">Address</TableHead>
                  <TableHead className="text-slate-600 font-medium">Schedule</TableHead>
                  <TableHead className="text-slate-600 font-medium">Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row) => {
                  const needsReview = !readySet.has(row.row_index);
                  return (
                    <TableRow
                      key={row.row_index}
                      className={
                        needsReview
                          ? 'bg-amber-50/50 hover:bg-amber-50/70 border-slate-100'
                          : 'border-slate-100 hover:bg-slate-50/50'
                      }
                    >
                      <TableCell className="font-mono text-xs text-slate-500">
                        {row.row_index + 1}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-slate-800" title={row.customer}>
                        {row.customer || '—'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-slate-800" title={row.building}>
                        {row.building || '—'}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-slate-800" title={row.address}>
                        {row.address || '—'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-slate-700" title={row.service_schedule_raw}>
                        {row.service_schedule_raw || '—'}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate text-slate-700" title={row.operator_name}>
                        {row.operator_name || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="py-6">
          <p className="text-sm text-slate-600 mb-4">
            Import all rows (errors skipped), or import only rows with no issues. Warnings never block.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Button
              onClick={() => handleImport('all')}
              disabled={importing}
              className="min-w-[180px] h-11 font-medium"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                'Start migration'
              )}
            </Button>
            {s.rows_needing_review > 0 && (
              <Button
                variant="outline"
                onClick={() => setExpandedIssueGroups(new Set(issueEntries.map((e) => e.label)))}
                className="border-slate-200 text-slate-700 h-11 hover:bg-slate-50"
              >
                Review flagged rows
              </Button>
            )}
            {hasReadyOnly && (
              <Button
                variant="outline"
                onClick={() => handleImport('ready_only')}
                disabled={importing}
                className="border-slate-200 text-slate-700 h-11 hover:bg-slate-50"
              >
                Import ready rows only
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
