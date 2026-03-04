'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  listExpenseReceipts,
  createExpenseReceipt,
  fileReceiptForTaxes,
  type ExpenseReceiptRow,
} from '@/actions/expense-receipts';
import type { EmployeeLaborSummary } from '@/lib/employee-labor-summary';
import { Upload, Receipt, FileCheck, Users } from 'lucide-react';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,.pdf';
const MAX_MB = 10;

interface ExpensesTabProps {
  orgId: string;
  laborSummary?: EmployeeLaborSummary | null;
}

export function ExpensesTab({ orgId, laborSummary }: ExpensesTabProps) {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<ExpenseReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filingId, setFilingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listExpenseReceipts(orgId);
      if (!cancelled) setReceipts(list);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [orgId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    setFile(chosen);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({ title: 'Select a file', description: 'Choose a receipt image or PDF.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: 'File too large', description: `Maximum size is ${MAX_MB}MB.`, variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = file.name.slice(0, 60).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${orgId}/receipts/${Date.now()}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('expense-receipts')
        .upload(storagePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const result = await createExpenseReceipt({
        orgId,
        storagePath,
        fileName: file.name,
      });

      if (!result.ok) throw new Error(result.error);
      toast({ title: 'Receipt uploaded', description: 'You can add details and file it for taxes.' });
      setFile(null);
      const list = await listExpenseReceipts(orgId);
      setReceipts(list);
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Could not upload receipt.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileForTaxes = async (receipt: ExpenseReceiptRow) => {
    setFilingId(receipt.id);
    try {
      const result = await fileReceiptForTaxes(receipt.id, {
        category: receipt.category ?? 'Uncategorized',
        taxCategory: receipt.tax_category ?? 'General expense',
      });
      if (!result.ok) throw new Error(result.error);
      toast({ title: 'Filed for taxes', description: 'Receipt marked for tax records.' });
      const list = await listExpenseReceipts(orgId);
      setReceipts(list);
    } catch (err) {
      toast({
        title: 'Could not file',
        description: err instanceof Error ? err.message : 'Try again.',
        variant: 'destructive',
      });
    } finally {
      setFilingId(null);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      {/* Payroll */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          Payroll
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-l-4 border-border">
            <CardContent className="p-3">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">Monthly payroll</span>
              <p className="font-heading text-lg font-bold tabular-nums mt-0.5">
                {laborSummary ? formatCurrency(laborSummary.monthlyLaborDollars) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-border">
            <CardContent className="p-3">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">Hourly</span>
              <p className="font-heading text-lg font-bold tabular-nums mt-0.5">
                {laborSummary ? formatCurrency(laborSummary.hourlyTotal) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {laborSummary?.hourlyCount ?? 0} employees
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-border">
            <CardContent className="p-3">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">Salary</span>
              <p className="font-heading text-lg font-bold tabular-nums mt-0.5">
                {laborSummary ? formatCurrency(laborSummary.salaryTotal) : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {laborSummary?.salaryCount ?? 0} employees
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-border">
            <CardContent className="p-3">
              <span className="text-[10px] font-medium uppercase text-muted-foreground">Active staff</span>
              <p className="font-heading text-lg font-bold tabular-nums mt-0.5">
                {laborSummary?.activeCount ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Receipts */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          <Receipt className="h-3.5 w-3.5" />
          Receipts & expense records
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Upload receipt photos or PDFs. Use &quot;File for taxes&quot; to mark them for your records; AI-assisted categorization can be added later.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload receipt
            </CardTitle>
            <CardDescription>Image or PDF, max {MAX_MB}MB</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="receipt-file" className="sr-only">Receipt file</Label>
                <Input
                  id="receipt-file"
                  type="file"
                  accept={ACCEPT}
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
              <Button type="submit" disabled={!file || uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent receipts</CardTitle>
            <CardDescription>Add details and file for taxes when ready</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : receipts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No receipts yet. Upload one above.</p>
            ) : (
              <ul className="space-y-3">
                {receipts.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-3 bg-muted/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {r.signed_url ? (
                        <a
                          href={r.signed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 w-12 h-12 rounded border bg-muted overflow-hidden flex items-center justify-center"
                        >
                          <img src={r.signed_url} alt="" className="object-cover w-full h-full" />
                        </a>
                      ) : (
                        <div className="shrink-0 w-12 h-12 rounded border bg-muted flex items-center justify-center">
                          <Receipt className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.amount != null ? formatCurrency(r.amount) : '—'} · {formatDate(r.receipt_date ?? r.created_at)}
                          {r.vendor && ` · ${r.vendor}`}
                        </p>
                        {r.tax_category && (
                          <p className="text-xs text-muted-foreground">Tax: {r.tax_category}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      {r.ai_filed_at ? (
                        <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                          <FileCheck className="h-3.5 w-3.5" /> Filed for taxes
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileForTaxes(r)}
                          disabled={filingId === r.id}
                        >
                          {filingId === r.id ? 'Filing…' : 'File for taxes'}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
