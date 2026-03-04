'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit-log';

/** Update invoice and log to audit. Use this from server or from client (e.g. invoice form) to ensure edits are audited. */
export async function updateInvoiceWithAudit(
  invoiceId: string,
  payload: Record<string, unknown>
): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: before } = await supabase.from('invoices').select('*').eq('id', invoiceId).eq('org_id', org.org_id).single();
  if (!before) return { error: 'Invoice not found' };

  const { data: after, error } = await supabase.from('invoices').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', invoiceId).eq('org_id', org.org_id).select().single();
  if (error) return { error: error.message };

  await logAudit({
    orgId: org.org_id,
    action: 'invoice_edit',
    entityType: 'invoice',
    entityId: invoiceId,
    beforeState: before as Record<string, unknown>,
    afterState: after as Record<string, unknown>,
  });

  revalidatePath('/app/admin/invoices');
  return {};
}
