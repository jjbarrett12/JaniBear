import { createClient } from '@/lib/supabase/server';
import type {
  AccountOption,
  FacilityWithHealth,
  Prospect,
  Quadrant,
  TerritoryMapPayload,
} from '@/types/territory-map';

/**
 * Fetch all data needed for the Territory Map page (RLS-safe).
 * Returns accounts, quadrants (both modes), facilities with health, and prospects.
 */
export async function getTerritoryMapData(orgId: string): Promise<TerritoryMapPayload> {
  const supabase = await createClient();

  const [accountsRes, quadrantsRes, facilitiesRes, healthRes, prospectsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name'),

    supabase
      .from('quadrants')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at'),

    supabase
      .from('facilities')
      .select('id, org_id, account_id, name, address_line1, city, state, zip, latitude, longitude, accounts!inner(name)')
      .eq('org_id', orgId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),

    supabase
      .from('site_health')
      .select('*')
      .eq('org_id', orgId),

    supabase
      .from('prospects')
      .select('*')
      .eq('org_id', orgId)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('created_at', { ascending: false }),
  ]);

  const accounts: AccountOption[] = (accountsRes.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
  }));

  const quadrants: Quadrant[] = (quadrantsRes.data ?? []) as Quadrant[];

  const healthMap = new Map(
    (healthRes.data ?? []).map((h) => [h.site_id, h])
  );

  const facilities: FacilityWithHealth[] = (facilitiesRes.data ?? []).map((f: Record<string, unknown>) => {
    const h = healthMap.get(f.id as string);
    const acct = f.accounts as { name: string } | null;
    return {
      id: f.id as string,
      org_id: f.org_id as string,
      account_id: f.account_id as string,
      name: f.name as string,
      address_line1: f.address_line1 as string | null,
      city: f.city as string | null,
      state: f.state as string | null,
      zip: f.zip as string | null,
      latitude: f.latitude as number,
      longitude: f.longitude as number,
      account_name: acct?.name ?? '',
      health_status: h?.health_status ?? 'green',
      last_inspection_at: h?.last_inspection_at ?? null,
      last_inspection_score: h?.last_inspection_score ?? null,
      checklist_completion_7d: h?.checklist_completion_7d ?? null,
      open_ticket_count: h?.open_ticket_count ?? 0,
      overdue_ticket_count: h?.overdue_ticket_count ?? 0,
      missed_shifts_7d: h?.missed_shifts_7d ?? 0,
    };
  });

  const prospects: Prospect[] = (prospectsRes.data ?? []) as Prospect[];

  return { accounts, quadrants, facilities, prospects };
}
