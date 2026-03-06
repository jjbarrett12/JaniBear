/**
 * GET /api/app/maps/entities
 * Returns geo_entities for the current org. Requires maps.read.
 * Query: types=lead,account,crew,franchisee | q=search | bbox=west,south,east,north (optional)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

const ENTITY_TYPES = ['lead', 'account', 'crew', 'franchisee', 'site', 'building', 'prospect'] as const;

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await requirePermission({ orgId, userId, permission: 'maps.read' });

    const { searchParams } = new URL(request.url);
    const typesParam = searchParams.get('types');
    const q = searchParams.get('q')?.trim() || '';
    const bbox = searchParams.get('bbox'); // west,south,east,north

    const types: string[] = typesParam
      ? typesParam.split(',').map((t) => t.trim()).filter((t) => ENTITY_TYPES.includes(t as typeof ENTITY_TYPES[number]))
      : [...ENTITY_TYPES];

    const supabase = await createClient();
    let query = supabase
      .from('geo_entities')
      .select('id, org_id, entity_type, entity_id, label, address1, city, state, postal_code, country, lat, lng, source, updated_at')
      .eq('org_id', orgId)
      .in('entity_type', types)
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (q) {
      query = query.or(`label.ilike.%${q}%,address1.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,postal_code.ilike.%${q}%`);
    }
    if (bbox) {
      const [west, south, east, north] = bbox.split(',').map(Number);
      if ([west, south, east, north].every((n) => !Number.isNaN(n))) {
        query = query
          .gte('lng', west)
          .lte('lng', east)
          .gte('lat', south)
          .lte('lat', north);
      }
    }

    const { data, error } = await query.order('updated_at', { ascending: false }).limit(500);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = (data ?? []).map((row) => ({
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      label: row.label,
      lat: row.lat,
      lng: row.lng,
      city: row.city ?? null,
      state: row.state ?? null,
      source: row.source ?? null,
    }));

    return NextResponse.json({ orgId, entities: list });
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
