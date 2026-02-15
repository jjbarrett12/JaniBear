'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { importProGearCsvAction } from '@/app/app/pro-gear/admin-actions';

export function ProGearImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setPending(true);
    setResult(null);
    try {
      const text = await file.text();
      const msg = await importProGearCsvAction(text, dryRun);
      setResult(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="csv">CSV file</Label>
        <Input
          id="csv"
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
        />
        Dry run (validate only, no write)
      </label>
      <Button type="submit" disabled={!file || pending}>
        {dryRun ? 'Validate' : 'Import'}
      </Button>
      {result && (
        <pre className="rounded-md border border-border bg-muted p-3 text-sm whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </form>
  );
}
