'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/hint';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';

const ACCEPT = '.csv,.xlsx,.xls';
const ACCEPT_LIST = ['csv', 'xlsx', 'xls'];

function isValidExt(name: string): boolean {
  const ext = name.toLowerCase().split('.').pop();
  return ext ? ACCEPT_LIST.includes(ext) : false;
}

export function ImportUploadClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const f = files[0];
    if (!isValidExt(f.name)) {
      setError('Please use a CSV or Excel (.xlsx) file.');
      return;
    }
    setFile(f);
    setError(null);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a file to continue.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding/import/create-batch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create batch');
      const { batchId, orgId } = data;
      const ext = file.name.toLowerCase().split('.').pop() || 'csv';
      const path = `${orgId}/${batchId}/source.${ext}`;
      const supabase = createClient();
      const { error: uploadErr } = await supabase.storage
        .from('onboarding-imports')
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (uploadErr) throw new Error(uploadErr.message);
      const setRes = await fetch('/api/onboarding/import/set-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, filePath: path }),
      });
      if (!setRes.ok) {
        const setData = await setRes.json();
        throw new Error(setData.error || 'Failed to save file path');
      }
      router.push(`/onboarding/import/review?batchId=${batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Choose spreadsheet file"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            className={`
              relative flex min-h-[200px] flex-col items-center justify-center gap-4 px-8 py-10 m-5
              cursor-pointer transition-all duration-200 rounded-xl border-2 border-dashed
              ${dragActive ? 'border-slate-400 bg-slate-100/80' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'}
              ${error ? 'border-red-300 bg-red-50/50' : ''}
            `}
            aria-describedby="upload-hint upload-formats"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200/80 text-slate-600">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                {file ? file.name : 'Drop your file here or click to upload'}
              </p>
              <p id="upload-formats" className="text-xs text-slate-500">
                {file ? 'Click or drop a different file' : 'CSV or Excel (.xlsx)'}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4">
            <div id="upload-hint">
              <Hint className="text-center block">
                We analyze your file before anything is imported. Nothing is created until you confirm.
              </Hint>
            </div>
            {error && (
              <p className="text-sm text-red-600 text-center" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={loading || !file}
              className="w-full h-11 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing file…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Continue to review
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
