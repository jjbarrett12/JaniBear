'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getBenchmarkSettings, updateBenchmarkSettings } from '@/actions/benchmarking';
import { BarChart3 } from 'lucide-react';

const SIZE_BUCKETS = ['', '1-10', '11-50', '51-200', '201+', 'unknown'];
const VERTICALS = ['', 'medical', 'industrial', 'education', 'retail', 'other', 'unknown'];

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function BenchmarkingSettings({ orgId }: { orgId: string }) {
  const [optIn, setOptIn] = useState(false);
  const [bucket, setBucket] = useState('');
  const [vertical, setVertical] = useState('');
  const [shareCode, setShareCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBenchmarkSettings(orgId).then((s) => {
      if (!s.error) {
        setOptIn(s.benchmarkingOptIn);
        setBucket(s.companySizeBucket ?? '');
        setVertical(s.vertical ?? '');
        setShareCode(s.benchmarkShareCode ?? '');
      }
      setLoading(false);
    });
  }, [orgId]);

  const handleSave = async () => {
    setSaving(true);
    await updateBenchmarkSettings(orgId, {
      benchmarkingOptIn: optIn,
      companySizeBucket: bucket || null,
      vertical: vertical || null,
      benchmarkShareCode: shareCode.trim() || null,
    });
    setSaving(false);
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Benchmarking
        </CardTitle>
        <CardDescription>
          Compare your metrics with anonymized peers, or share a code with specific JANIBEAR orgs to benchmark only with them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Anonymous peer benchmarks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="benchmark-opt-in"
              checked={optIn}
              onChange={(e) => setOptIn(e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="benchmark-opt-in">Include our organization in anonymized benchmarks</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Compare to anonymous offices by peer group. Only aggregates are shared; no raw data.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Company size (peer group)</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
              >
                {SIZE_BUCKETS.map((b) => (
                  <option key={b || 'empty'} value={b}>{b || '—'}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vertical (peer group)</Label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
              >
                {VERTICALS.map((v) => (
                  <option key={v || 'empty'} value={v}>{v ? v : 'All'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Share code: benchmark with specific orgs */}
        <div className="space-y-3 border-t border-border pt-4">
          <Label className="text-sm font-medium">Benchmark with a specific group</Label>
          <p className="text-xs text-muted-foreground">
            Share a code with other JANIBEAR orgs. Only orgs that use the same code will see each other&apos;s aggregated metrics. Leave blank to use only anonymous benchmarks.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="e.g. ABC123"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12))}
              className="font-mono w-32"
              maxLength={12}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShareCode(generateShareCode())}
            >
              Generate code
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
