/**
 * GET /api/app/maps/layers/sales
 * Returns geo data for Sales map: leads/prospects + optional accounts (read-only).
 * Requires maps.read and lead.read for lead data.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import { hasPermission } from '@/lib/auth/permission-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission({ orgId, userId, permission: 'maps.read' });
    const canReadLeads = await hasPermission(orgId, userId, 'lead.read');
    const canReadAccounts = await hasPermission(orgId, userId, 'accounts.read');

    const supabase = await createClient();

    const entities: Array<{
      entity_type: string;
      entity_id: string;
      label: string;
      lat: number;
      lng: number;
      city: string | null;
      state: string | null;
      source: string | null;
      status?: string;
      priority?: string;
      contact_name?: string | null;
    }> = [];

    if (canReadLeads) {
      const { data: geoLeads } = await supabase
        .from('geo_entities')
        .select('entity_id, label, lat, lng, city, state, source')
        .eq('org_id', orgId)
        .in('entity_type', ['lead', 'prospect'])
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      for (const row of geoLeads ?? []) {
        entities.push({
          entity_type: 'lead',
          entity_id: row.entity_id,
          label: row.label,
          lat: row.lat!,
          lng: row.lng!,
          city: row.city ?? null,
          state: row.state ?? null,
          source: row.source ?? null,
        });
      }
      // Fallback: if no geo_entities for leads, return prospects table (existing behavior)
      if ((geoLeads ?? []).length === 0) {
        const { data: prospects } = await supabase
          .from('prospects')
          .select('id, name, lat, lng, city, state, postal, status')
          .eq('org_id', orgId)
          .not('lat', 'is', null)
          .not('lng', 'is', null)
          .limit(500);
        for (const p of prospects ?? []) {
          entities.push({
            entity_type: 'lead',
            entity_id: p.id,
            label: p.name ?? 'Unknown',
            lat: p.lat!,
            lng: p.lng!,
            city: p.city ?? null,
            state: p.state ?? null,
            source: null,
            status: p.status ?? undefined,
          });
        }
      }
    }

    if (canReadAccounts) {
      const { data: geoAccounts } = await supabase
        .from('geo_entities')
        .select('entity_id, label, lat, lng, city, state, source')
        .eq('org_id', orgId)
        .in('entity_type', ['account', 'site', 'building'])
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      for (const row of geoAccounts ?? []) {
        entities.push({
          entity_type: 'account',
          entity_id: row.entity_id,
          label: row.label,
          lat: row.lat!,
          lng: row.lng!,
          city: row.city ?? null,
          state: row.state ?? null,
          source: row.source ?? null,
        });
      }
    }

    return NextResponse.json({ orgId, entities });
  } catch (e) {
    const err = e as { message?: string };
    if (err.message?.includes('FORBIDDEN') || err.message?.includes('permission')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (err.message?.includes('NO_ORG') || err.message?.includes('NO_SESSION')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
