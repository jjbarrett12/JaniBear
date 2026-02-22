import { createClient } from '@/lib/supabase/server';

/**
 * Whether Member Pro Gear is enabled for this org.
 * When false, hide nav entry and show "Contact admin to enable" on direct route hit.
 */
export async function getProGearEnabled(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('pro_gear_enabled')
    .eq('id', orgId)
    .maybeSingle();
  return (data as { pro_gear_enabled?: boolean } | null)?.pro_gear_enabled === true;
}
