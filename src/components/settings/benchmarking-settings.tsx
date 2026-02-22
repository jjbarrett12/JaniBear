'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { getBenchmarkSettings, updateBenchmarkSettings } from '@/actions/benchmarking';
import { BarChart3 } from 'lucide-react';

const SIZE_BUCKETS = ['', '1-10', '11-50', '51-200', '201+', 'unknown'];
const VERTICALS = ['', 'medical', 'industrial', 'education', 'retail', 'other', 'unknown'];

export function BenchmarkingSettings({ orgId }: { orgId: string }) {
  const [optIn, setOptIn] = useState(false);
  const [bucket, setBucket] = useState('');
  const [vertical, setVertical] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBenchmarkSettings(orgId).then((s) => {
      if (!s.error) {
        setOptIn(s.benchmarkingOptIn);
        setBucket(s.companySizeBucket ?? '');
        setVertical(s.vertical ?? '');
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
          Opt in to contribute anonymized metrics and compare to peers. Only aggregates are shared; no raw data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
                <option key={v || 'empty'} value={v}>{v || '—'}</option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  );
}
