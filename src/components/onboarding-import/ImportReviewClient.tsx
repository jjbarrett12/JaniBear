'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Hint } from '@/components/ui/hint';
import { normalizeHeader } from '@/lib/onboarding-import/normalize';

type OrgType = 'franchisor' | 'franchisee' | 'independent';

interface Props {
  batchId: string;
  orgType?: OrgType;
}

type MappingState = Record<string, string>;

/** JANIBEAR field key → friendly label for the mapping panel */
const FIELD_LABELS: Record<string, string> = {
  customer_name: 'Customer',
  building_name: 'Building',
  address: 'Address',
  contact_name: 'Contact name',
  contact_email: 'Contact email',
  operator_name: 'Operator',
  service_schedule_raw: 'Service schedule',
};

export function ImportReviewClient({ batchId, orgType = 'independent' }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [normalizedColumns, setNormalizedColumns] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [suggestedMapping, setSuggestedMapping] = useState<MappingState>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [needsUserInput, setNeedsUserInput] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [confirmedMapping, setConfirmedMapping] = useState<MappingState>({});
  const [saving, setSaving] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<string>('generic_spreadsheet');
  const [detectionConfidence, setDetectionConfidence] = useState<number>(0);
  const [platformOverride, setPlatformOverride] = useState<string | null>(null);

  const operatorLabel = orgType === 'franchisor' ? 'Franchisee' : 'Operator';
  const FIELD_LABELS_WITH_ORG = { ...FIELD_LABELS, operator_name: operatorLabel };

  const FIELDS = [
    { key: 'customer_name', required: true },
    { key: 'building_name', required: false },
    { key: 'address', required: false },
    { key: 'contact_name', required: false },
    { key: 'contact_email', required: false },
    { key: 'operator_name', required: false },
    { key: 'service_schedule_raw', required: false },
  ];

  useEffect(() => {
    if (!batchId) {
      setError('Missing batch');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const parseRes = await fetch('/api/onboarding/import/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId }),
        });
        if (!parseRes.ok) {
          const d = await parseRes.json();
          throw new Error(d.error || 'Parse failed');
        }
        const parseData = await parseRes.json();
        const cols = parseData.columns ?? [];
        setColumns(cols);
        setNormalizedColumns(parseData.normalizedColumns ?? []);
        setRowCount(parseData.rowCount ?? 0);
        setSampleRows(parseData.sampleRows ?? []);

        const [detectRes, mapRes] = await Promise.all([
          fetch('/api/onboarding/import/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ columns: cols }),
          }),
          fetch('/api/onboarding/import/map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              columns: parseData.columns,
              sampleRows: parseData.sampleRows,
            }),
          }),
        ]);

        const detectData = detectRes.ok ? await detectRes.json() : {};
        const platform = detectData.platform ?? 'generic_spreadsheet';
        setDetectionConfidence(detectData.confidence ?? 0);
        const templateMapping = (detectData.suggested_mapping ?? {}) as MappingState;
        setDetectedPlatform(platform);

        if (!mapRes.ok) {
          const d = await mapRes.json();
          throw new Error(d.error || 'Mapping failed');
        }
        const mapData = await mapRes.json();
        const aiMappings = (mapData.mappings ?? {}) as MappingState;
        setSuggestedMapping(aiMappings);
        setConfidence(mapData.confidence ?? {});
        setNeedsUserInput(mapData.needs_user_input ?? []);
        setNotes(mapData.notes ?? []);
        setConfirmedMapping({ ...aiMappings, ...templateMapping });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId]);

  async function handleContinue() {
    if (!batchId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/import/batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, mapping: confirmedMapping, status: 'mapped' }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(`/onboarding/import/confirm?batchId=${batchId}`);
    } catch {
      setError('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  }

  async function handlePlatformOverride(value: string) {
    setPlatformOverride(value);
    setDetectedPlatform(value);
    setDetectionConfidence(value === 'generic_spreadsheet' ? 0 : 1);
    if (value === 'generic_spreadsheet') {
      setConfirmedMapping(suggestedMapping);
      return;
    }
    if (!columns.length) return;
    const res = await fetch('/api/onboarding/import/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns, overridePlatform: value }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const template = (data.suggested_mapping ?? {}) as MappingState;
    setConfirmedMapping((prev) => ({ ...prev, ...template }));
  }

  const mustFix = FIELDS.filter(
    (f) =>
      f.required &&
      (!confirmedMapping[f.key] ||
        needsUserInput.includes(f.key) ||
        (confidence[f.key] ?? 0) < 0.75)
  ).length;

  const isHighConfidence = (key: string) =>
    (confidence[key] ?? 0) >= 0.75 && !needsUserInput.includes(key);

  // Preview table: show sample rows using current mapping (normalized keys in sampleRows)
  const previewFields = [
    'customer_name',
    'building_name',
    'address',
    'service_schedule_raw',
    'operator_name',
  ].filter((k) => confirmedMapping[k]);
  const displayLabels: Record<string, string> = {
    customer_name: 'Customer',
    building_name: 'Building',
    address: 'Address',
    service_schedule_raw: 'Schedule',
    operator_name: operatorLabel,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <span className="text-sm text-slate-600">Reading your spreadsheet…</span>
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

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Confirm Your Data Mapping
        </h1>
        <p className="text-slate-600 text-base max-w-xl">
          JANIBEAR matched your spreadsheet columns automatically. Review anything marked for confirmation.
        </p>
      </header>

      {/* Mapping panel: two-column layout — Your column → JANIBEAR field */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Your spreadsheet → JANIBEAR
          </CardTitle>
          <p className="text-sm text-slate-500">
            Pick which column from your file maps to each JANIBEAR field. Change any with the dropdown.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Two-column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center pb-2 border-b border-slate-100 mb-2">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Spreadsheet column
            </div>
            <div aria-hidden />
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              JANIBEAR field
            </div>
          </div>
          {FIELDS.map((f) => {
            const highConfidence = isHighConfidence(f.key);
            const label = FIELD_LABELS_WITH_ORG[f.key];
            const mappedNorm = confirmedMapping[f.key] ?? '';
            const rawColumn =
              mappedNorm && normalizedColumns.includes(mappedNorm)
                ? columns[normalizedColumns.indexOf(mappedNorm)] ?? mappedNorm
                : '';

            return (
              <div key={f.key} className="border-b border-slate-100 last:border-b-0">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 py-3 items-center">
                  <div className="min-w-0">
                    <Select
                      value={mappedNorm || '__none__'}
                      onValueChange={(v) =>
                        setConfirmedMapping((prev) => ({
                          ...prev,
                          [f.key]: v === '__none__' ? '' : v,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={`w-full sm:max-w-[220px] rounded-lg border-slate-200 ${
                          !highConfidence && mappedNorm
                            ? 'border-amber-300 bg-amber-50/50'
                            : 'bg-white'
                        }`}
                      >
                        <SelectValue placeholder="Choose a column…">
                          {rawColumn || 'Choose a column…'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Don’t import</SelectItem>
                        {columns.map((raw) => {
                          const norm = normalizeHeader(raw);
                          return (
                            <SelectItem key={norm} value={norm}>
                              {raw}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="flex shrink-0 items-center justify-center text-slate-300" aria-hidden>
                    <ArrowRight className="h-5 w-5" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-slate-800">{label}</span>
                    {f.required && (
                      <span className="text-xs text-slate-400">required</span>
                    )}
                    {mappedNorm ? (
                      highConfidence ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          High confidence
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          Needs confirmation
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
                {f.key === 'service_schedule_raw' && (
                  <Hint className="mt-1.5">Schedules use weekly frequency (1x–7x per week) plus which days (Mon–Sun).</Hint>
                )}
                {f.key === 'operator_name' && (
                  <Hint className="mt-1.5">Operator may represent a crew, team, or franchisee depending on your organization.</Hint>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {notes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
          <ul className="text-sm text-slate-600 list-disc list-inside space-y-0.5">
            {notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview rows table */}
      {sampleRows.length > 0 && previewFields.length > 0 && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Preview
            </CardTitle>
            <p className="text-sm text-slate-500">
              First rows with your current mapping. {rowCount} row{rowCount !== 1 ? 's' : ''} total.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[280px] overflow-y-auto rounded-b-xl">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50/90 hover:bg-slate-50/90">
                    <TableHead className="w-10 text-slate-600 font-medium">#</TableHead>
                    {previewFields.map((k) => (
                      <TableHead key={k} className="text-slate-600 font-medium">
                        {displayLabels[k]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleRows.slice(0, 10).map((row, idx) => (
                    <TableRow key={idx} className="border-slate-100">
                      <TableCell className="font-mono text-xs text-slate-500">{idx + 1}</TableCell>
                      {previewFields.map((k) => (
                        <TableCell
                          key={k}
                          className="max-w-[140px] truncate text-sm text-slate-800"
                          title={row[confirmedMapping[k]] ?? ''}
                        >
                          {row[confirmedMapping[k]] || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 pt-2">
        <Button
          onClick={handleContinue}
          disabled={saving || mustFix > 0}
          className="min-w-[200px] h-11 rounded-lg font-medium"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Continue to Migration Review'
          )}
        </Button>
        <Button variant="outline" asChild className="rounded-lg border-slate-200 text-slate-700 h-11">
          <Link href="/onboarding/import/upload">Back to Upload</Link>
        </Button>
        {mustFix > 0 && (
          <p className="text-sm text-amber-700">
            Confirm the fields marked “Needs confirmation” or choose a column for required fields.
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
