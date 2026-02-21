/**
 * Backfill CRM canonical chain (safe, non-destructive).
 * - locations.client_id (or sites.client_id) from opportunities where site matches
 * - opportunities.location_id from site_id (same id when facility table is sites) or by matching address to locations
 * - walkthroughs.location_id from site_id
 * Run after migration 048_crm_canonical_chain.sql.
 *
 * Usage:
 *   npx tsx scripts/backfill-crm-canonical.ts
 *   # or: node --loader ts-node/esm scripts/backfill-crm-canonical.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

type FacilityRow = { id: string; org_id: string; name: string | null; address?: string | null; city?: string | null; state?: string | null; zip?: string | null };

async function hasTable(name: string): Promise<boolean> {
  const { data, error } = await supabase.from(name).select('id').limit(1);
  if (error?.code === '42P01') return false; // relation does not exist
  if (error) {
    console.warn(`hasTable(${name}):`, error.message);
    return false;
  }
  return true;
}

async function backfillFacilityClientId(facilityTable: 'locations' | 'sites'): Promise<{ updated: number }> {
  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, org_id, client_id, site_id')
    .not('client_id', 'is', null)
    .not('site_id', 'is', null);

  if (!opportunities?.length) {
    return { updated: 0 };
  }

  let updated = 0;
  for (const opp of opportunities) {
    const { data: facility } = await supabase
      .from(facilityTable)
      .select('id, client_id')
      .eq('id', opp.site_id)
      .eq('org_id', opp.org_id)
      .single();

    if (!facility || facility.client_id != null) continue;

    const { error } = await supabase
      .from(facilityTable)
      .update({ client_id: opp.client_id })
      .eq('id', opp.site_id)
      .eq('org_id', opp.org_id);

    if (!error) updated++;
  }
  return { updated };
}

async function backfillOpportunityLocationId(hasLocations: boolean, hasSites: boolean): Promise<{ updated: number }> {
  if (!hasLocations && !hasSites) return { updated: 0 };

  const { data: rows } = await supabase
    .from('opportunities')
    .select('id, org_id, site_id, location_id')
    .not('site_id', 'is', null);

  if (!rows?.length) return { updated: 0 };

  let updated = 0;
  if (hasSites) {
    for (const o of rows) {
      if ((o as { location_id?: string }).location_id != null) continue;
      const { error } = await supabase
        .from('opportunities')
        .update({ location_id: o.site_id })
        .eq('id', o.id)
        .eq('org_id', o.org_id);
      if (!error) updated++;
    }
    return { updated };
  }

  if (hasLocations && hasSites) {
    const { data: sites } = await supabase.from('sites').select('id, org_id, name, address, city, state, zip');
    const siteMap = new Map<string, FacilityRow>();
    sites?.forEach((s) => siteMap.set(s.id, s));

    for (const o of rows) {
      if ((o as { location_id?: string }).location_id != null) continue;
      const site = siteMap.get(o.site_id!);
      if (!site) continue;
      const { data: locs } = await supabase
        .from('locations')
        .select('id')
        .eq('org_id', o.org_id)
        .eq('name', site.name ?? '')
        .eq('address', site.address ?? '')
        .eq('city', site.city ?? '')
        .eq('state', site.state ?? '')
        .eq('zip', site.zip ?? '')
        .limit(2);
      const single = locs?.length === 1 ? locs[0] : null;
      if (single?.id) {
        const { error } = await supabase
          .from('opportunities')
          .update({ location_id: single.id })
          .eq('id', o.id)
          .eq('org_id', o.org_id);
        if (!error) updated++;
      }
    }
  }
  return { updated };
}

async function backfillWalkthroughLocationId(): Promise<{ updated: number }> {
  const { data: rows } = await supabase
    .from('walkthroughs')
    .select('id, org_id, site_id')
    .not('site_id', 'is', null);

  if (!rows?.length) return { updated: 0 };

  let updated = 0;
  for (const w of rows) {
    const { error } = await supabase
      .from('walkthroughs')
      .update({ location_id: w.site_id })
      .eq('id', w.id)
      .eq('org_id', w.org_id);
    if (!error) updated++;
  }
  return { updated };
}

async function main() {
  console.log('Backfill CRM canonical chain (safe, non-destructive)...\n');

  const hasLocations = await hasTable('locations');
  const hasSites = await hasTable('sites');
  console.log('Facility table: locations=%s, sites=%s\n', hasLocations, hasSites);

  const facilityTable = hasLocations ? 'locations' : hasSites ? 'sites' : null;
  if (facilityTable) {
    const r1 = await backfillFacilityClientId(facilityTable);
    console.log(`[${facilityTable}.client_id] updated: ${r1.updated}`);
  }

  const r2 = await backfillOpportunityLocationId(hasLocations, hasSites);
  console.log('[opportunities.location_id] updated:', r2.updated);

  const r3 = await backfillWalkthroughLocationId();
  console.log('[walkthroughs.location_id] updated:', r3.updated);

  console.log('\nDone. No rows deleted.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
