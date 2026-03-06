/**
 * GET /api/app/maps/layers/ops
 * Returns geo data for Ops map: accounts/sites + crews/franchisees + service_areas + assignments.
 * Requires maps.read and ops.read.
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
    const canReadOps = await hasPermission(orgId, userId, 'ops.read');
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
    }> = [];
    const serviceAreas: Array<{ id: string; name: string; type: string; geojson: unknown; color: string | null }> = [];
    const assignments: Array<{ service_area_id: string; assignee_type: string; assignee_id: string }> = [];

    if (canReadOps || canReadAccounts) {
      const { data: geoRows } = await supabase
        .from('geo_entities')
        .select('entity_type, entity_id, label, lat, lng, city, state')
        .eq('org_id', orgId)
        .in('entity_type', ['account', 'site', 'building', 'crew', 'franchisee'])
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      for (const row of geoRows ?? []) {
        entities.push({
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          label: row.label,
          lat: row.lat!,
          lng: row.lng!,
          city: row.city ?? null,
          state: row.state ?? null,
        });
      }
      // Fallback: facilities with lat/lng (existing behavior)
      if ((geoRows ?? []).length === 0 && canReadAccounts) {
        const { data: facilities } = await supabase
          .from('facilities')
          .select('id, name, latitude, longitude, city, state, accounts(name)')
          .eq('org_id', orgId)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(500);
        for (const f of facilities ?? []) {
          const acct = f.accounts as { name?: string } | null;
          entities.push({
            entity_type: 'site',
            entity_id: f.id,
            label: f.name ?? acct?.name ?? 'Site',
            lat: f.latitude!,
            lng: f.longitude!,
            city: f.city ?? null,
            state: f.state ?? null,
          });
        }
      }
    }

    if (canReadOps) {
      const { data: areas } = await supabase
        .from('service_areas')
        .select('id, name, type, geojson, color')
        .eq('org_id', orgId);
      for (const a of areas ?? []) {
        serviceAreas.push({
          id: a.id,
          name: a.name,
          type: a.type,
          geojson: a.geojson,
          color: a.color ?? null,
        });
      }
      const { data: assignRows } = await supabase
        .from('service_area_assignments')
        .select('service_area_id, assignee_type, assignee_id')
        .eq('org_id', orgId);
      for (const a of assignRows ?? []) {
        assignments.push({
          service_area_id: a.service_area_id,
          assignee_type: a.assignee_type,
          assignee_id: a.assignee_id,
        });
      }
    }

    return NextResponse.json({
      orgId,
      entities,
      serviceAreas,
      assignments,
    });
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
