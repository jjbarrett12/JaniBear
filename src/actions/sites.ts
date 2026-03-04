'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Assign a crew to a site (location). Writes to crew_assignments only. */
export async function assignCrewToSite(
  orgId: string,
  locationId: string,
  crewId: string
): Promise<{ error?: string }> {
  await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase.from('crew_assignments').insert({
    org_id: orgId,
    crew_id: crewId,
    location_id: locationId,
    is_active: true,
  });

  if (error) return { error: error.message };
  revalidatePath('/app/sites');
  revalidatePath(`/app/sites/${locationId}`);
  return {};
}
