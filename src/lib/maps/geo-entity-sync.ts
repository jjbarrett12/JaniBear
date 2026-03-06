/**
 * Sync canonical geo_entities from source tables (prospects, facilities, accounts).
 * Call from server actions or API when leads are created/imported or facilities/accounts are created/updated.
 * All operations are org-scoped; RLS enforces.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type GeoEntityType = 'lead' | 'prospect' | 'account' | 'site' | 'building' | 'crew' | 'franchisee';
export type GeoSource = 'manual' | 'google_places' | 'geocode';

/** Upsert geo_entities row for a prospect (sales map). */
export async function upsertGeoEntityForProspect(params: {
  orgId: string;
  entityId: string;
  label: string;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  source?: GeoSource | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    orgId,
    entityId,
    label,
    address1,
    city,
    state,
    postalCode,
    lat,
    lng,
    source = 'manual',
  } = params;
  await supabase.from('geo_entities').upsert(
    {
      org_id: orgId,
      entity_type: 'prospect',
      entity_id: entityId,
      label: label || 'Unnamed',
      address1: address1 ?? null,
      city: city ?? null,
      state: state ?? null,
      postal_code: postalCode ?? null,
      country: 'US',
      lat: lat ?? null,
      lng: lng ?? null,
      source: source ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,entity_type,entity_id' }
  );
}

/** Upsert geo_entities row for a facility/site (ops map). */
export async function upsertGeoEntityForFacility(params: {
  orgId: string;
  entityId: string;
  label: string;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  source?: GeoSource | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    orgId,
    entityId,
    label,
    address1,
    city,
    state,
    postalCode,
    lat,
    lng,
    source = 'manual',
  } = params;
  await supabase.from('geo_entities').upsert(
    {
      org_id: orgId,
      entity_type: 'site',
      entity_id: entityId,
      label: label || 'Unnamed',
      address1: address1 ?? null,
      city: city ?? null,
      state: state ?? null,
      postal_code: postalCode ?? null,
      country: 'US',
      lat: lat ?? null,
      lng: lng ?? null,
      source: source ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,entity_type,entity_id' }
  );
}

/** Upsert geo_entities row for an account (ops map). */
export async function upsertGeoEntityForAccount(params: {
  orgId: string;
  entityId: string;
  label: string;
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  lat?: number | null;
  lng?: number | null;
  source?: GeoSource | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    orgId,
    entityId,
    label,
    address1,
    city,
    state,
    postalCode,
    lat,
    lng,
    source = 'manual',
  } = params;
  await supabase.from('geo_entities').upsert(
    {
      org_id: orgId,
      entity_type: 'account',
      entity_id: entityId,
      label: label || 'Unnamed',
      address1: address1 ?? null,
      city: city ?? null,
      state: state ?? null,
      postal_code: postalCode ?? null,
      country: 'US',
      lat: lat ?? null,
      lng: lng ?? null,
      source: source ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id,entity_type,entity_id' }
  );
}
