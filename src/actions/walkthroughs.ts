'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { requirePermission } from '@/lib/authz';
import { PERMISSIONS } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const createWalkthroughSchema = z.object({
  opportunity_id: z.string().optional(),
  location_id: z.string().optional(), // Canonical facility; do not use site_id for new rows
  scheduled_at: z.string(),
  notes: z.string().optional(),
});

export async function createWalkthrough(formData: FormData) {
  const org = await requireOrg();
  await requirePermission(PERMISSIONS.DASHBOARD_SALES_VIEW, org.org_id);
  const supabase = await createClient();
  
  const rawData = {
    opportunity_id: formData.get('opportunity_id') as string,
    location_id: formData.get('location_id') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    notes: formData.get('notes') as string,
  };

  // Validation (skipping full zod parse for brevity in stub)
  
  const { data, error } = await supabase
    .from('walkthroughs')
    .insert({
      org_id: org.org_id,
      opportunity_id: rawData.opportunity_id || null,
      location_id: rawData.location_id || null,
      scheduled_at: rawData.scheduled_at,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/app/walkthroughs');
  redirect(`/app/walkthroughs/${data.id}`);
}

export async function updateWalkthroughStatus(id: string, status: string) {
  const org = await requireOrg();
  await requirePermission(PERMISSIONS.DASHBOARD_SALES_VIEW, org.org_id);
  const supabase = await createClient();

  const { data: row, error: fetchErr } = await supabase
    .from('walkthroughs')
    .select('id, org_id')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .maybeSingle();
  if (fetchErr || !row) {
    throw new Error('Walkthrough not found or access denied');
  }

  const { error } = await supabase
    .from('walkthroughs')
    .update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null })
    .eq('id', id)
    .eq('org_id', org.org_id);

  if (error) throw error;
  revalidatePath(`/app/walkthroughs/${id}`);
}
