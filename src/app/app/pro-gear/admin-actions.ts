'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { isProGearAdmin } from '@/lib/pro-gear-auth';
import { revalidatePath } from 'next/cache';

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  return isProGearAdmin();
}

export async function toggleProGearProductFieldAction(
  productId: string,
  field: 'active' | 'featured',
  value: boolean
) {
  if (!(await ensureAdmin())) return false;
  const supabase = await createClient();
  const { error } = await supabase
    .from('pro_gear_products')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) return false;
  revalidatePath('/app/pro-gear');
  revalidatePath('/app/pro-gear/admin');
  return true;
}

export async function updateProGearProductAction(
  productId: string,
  data: {
    name?: string;
    slug?: string;
    sku?: string | null;
    brand?: string;
    description?: string;
    retail_price_cents?: number | null;
    member_price_cents?: number;
    savings_percent?: number | null;
    shipping_estimate_days?: number | null;
    active?: boolean;
    featured?: boolean;
    private_label_available?: boolean;
    private_label_moq_units?: number | null;
    private_label_notes?: string | null;
  }
) {
  if (!(await ensureAdmin())) return false;
  const supabase = await createClient();
  const { error } = await supabase
    .from('pro_gear_products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) return false;
  revalidatePath('/app/pro-gear');
  revalidatePath('/app/pro-gear/admin');
  return true;
}

export async function updateContactRequestStatusAction(
  requestId: string,
  status: 'new' | 'contacted' | 'closed'
) {
  if (!(await ensureAdmin())) return false;
  const supabase = await createClient();
  const { error } = await supabase
    .from('pro_gear_contact_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) return false;
  revalidatePath('/app/pro-gear/admin/contact-requests');
  return true;
}

export async function updatePrivateLabelInquiryStatusAction(
  inquiryId: string,
  status: 'new' | 'contacted' | 'quoted' | 'closed'
) {
  if (!(await ensureAdmin())) return false;
  const supabase = await createClient();
  const { error } = await supabase
    .from('pro_gear_private_label_inquiries')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', inquiryId);
  if (error) return false;
  revalidatePath('/app/pro-gear/admin/private-label-inquiries');
  return true;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

export async function importProGearCsvAction(
  csvText: string,
  dryRun: boolean
): Promise<string> {
  if (!(await ensureAdmin()))
    return 'Error: Not authorized.';

  const rows = parseCsv(csvText);
  if (rows.length === 0) return 'No rows to process.';

  const errors: string[] = [];
  const required = ['slug', 'name', 'category', 'member_price_cents'];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    for (const key of required) {
      if (!r[key]) errors.push(`Row ${i + 2}: missing ${key}`);
    }
    if (r.category && !['gloves', 'equipment'].includes(r.category)) {
      errors.push(`Row ${i + 2}: category must be gloves or equipment`);
    }
    const memberPrice = parseInt(r.member_price_cents ?? '', 10);
    if (r.member_price_cents !== '' && (isNaN(memberPrice) || memberPrice < 0)) {
      errors.push(`Row ${i + 2}: invalid member_price_cents`);
    }
  }
  if (errors.length > 0) return `Validation failed:\n${errors.join('\n')}`;
  if (dryRun) return `Dry run OK: ${rows.length} row(s) valid.`;

  const supabase = await createClient();
  let upserted = 0;
  for (const r of rows) {
    const payload = {
      slug: r.slug,
      sku: r.sku || null,
      name: r.name,
      category: r.category,
      brand: r.brand || null,
      description: r.description || null,
      retail_price_cents: r.retail_price_cents
        ? parseInt(r.retail_price_cents, 10)
        : null,
      member_price_cents: parseInt(r.member_price_cents, 10),
      savings_percent: r.savings_percent
        ? parseInt(r.savings_percent, 10)
        : null,
      shipping_estimate_days: r.shipping_estimate_days
        ? parseInt(r.shipping_estimate_days, 10)
        : null,
      featured: r.featured === 'true',
      active: r.active !== 'false',
      private_label_available: r.private_label_available === 'true',
      private_label_moq_units: r.private_label_moq_units
        ? parseInt(r.private_label_moq_units, 10)
        : null,
      private_label_notes: r.private_label_notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('pro_gear_products')
      .upsert(payload, { onConflict: 'slug' });
    if (!error) upserted++;
  }
  revalidatePath('/app/pro-gear');
  revalidatePath('/app/pro-gear/admin');
  return `Imported ${upserted} of ${rows.length} row(s).`;
}
