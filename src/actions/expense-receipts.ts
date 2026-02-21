'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const RECEIPTS_PATH = '/app/financial-health';

export interface ExpenseReceiptRow {
  id: string;
  org_id: string;
  storage_path: string;
  file_name: string;
  amount: number | null;
  receipt_date: string | null;
  category: string | null;
  tax_category: string | null;
  vendor: string | null;
  notes: string | null;
  ai_filed_at: string | null;
  created_at: string;
  /** Signed URL for private bucket; valid for 1 hour */
  signed_url?: string | null;
}

/** List expense receipts for an org; includes signed URLs for thumbnail/preview. */
export async function listExpenseReceipts(orgId: string): Promise<ExpenseReceiptRow[]> {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from('expense_receipts')
    .select('id, org_id, storage_path, file_name, amount, receipt_date, category, tax_category, vendor, notes, ai_filed_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) return [];
  if (!rows?.length) return [];

  const withUrls = await Promise.all(
    rows.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from('expense-receipts')
        .createSignedUrl(r.storage_path, 3600);
      return {
        ...r,
        signed_url: signed?.signedUrl ?? null,
      };
    })
  );
  return withUrls as ExpenseReceiptRow[];
}

/** Create expense receipt record after client uploads file to storage. */
export async function createExpenseReceipt(params: {
  orgId: string;
  storagePath: string;
  fileName: string;
  amount?: number | null;
  receiptDate?: string | null;
  category?: string | null;
  taxCategory?: string | null;
  vendor?: string | null;
  notes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not authenticated' };

  const { error } = await supabase.from('expense_receipts').insert({
    org_id: params.orgId,
    uploaded_by: user.id,
    storage_path: params.storagePath,
    file_name: params.fileName,
    amount: params.amount ?? null,
    receipt_date: params.receiptDate ?? null,
    category: params.category ?? null,
    tax_category: params.taxCategory ?? null,
    vendor: params.vendor ?? null,
    notes: params.notes ?? null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath(RECEIPTS_PATH);
  return { ok: true };
}

/** Mark receipt as filed for taxes (placeholder for future AI extraction). */
export async function fileReceiptForTaxes(
  receiptId: string,
  updates?: { category?: string; taxCategory?: string; amount?: number; vendor?: string }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('expense_receipts')
    .update({
      ai_filed_at: new Date().toISOString(),
      ...(updates?.category != null && { category: updates.category }),
      ...(updates?.taxCategory != null && { tax_category: updates.taxCategory }),
      ...(updates?.amount != null && { amount: updates.amount }),
      ...(updates?.vendor != null && { vendor: updates.vendor }),
    })
    .eq('id', receiptId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(RECEIPTS_PATH);
  return { ok: true };
}
