import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';

/**
 * GET /api/map/data
 * Returns map pins by org type (JaniBear OS):
 * - Franchisor: franchisee organizations only (no crews/personnel).
 * - Franchisee / Independent: customer locations + crew assignments by location (for targeting and ops).
 */
export async function GET() {
  const org = await requireOrg();
  const orgId = org.org_id as string;
  const orgType = (org.organizations as { org_type?: string } | null)?.org_type ?? 'independent';
  const supabase = await createClient();

  if (orgType === 'franchisor') {
    const { data: associations, error: assocError } = await supabase
      .from('franchise_associations')
      .select('franchisee_org_id')
      .eq('franchisor_org_id', orgId)
      .eq('status', 'active');
    if (assocError) {
      return NextResponse.json({ error: assocError.message }, { status: 500 });
    }
    const franchiseeIds = (associations ?? []).map((a) => a.franchisee_org_id);
    if (franchiseeIds.length === 0) {
      return NextResponse.json({ orgType: 'franchisor', franchisees: [] });
    }
    const { data: franchisees, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, address_line, city, state, zip, latitude, longitude')
      .in('id', franchiseeIds);
    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }
    return NextResponse.json({
      orgType: 'franchisor',
      franchisees: (franchisees ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        address: [o.address_line, o.city, o.state, o.zip].filter(Boolean).join(', ') || null,
        latitude: o.latitude != null ? Number(o.latitude) : null,
        longitude: o.longitude != null ? Number(o.longitude) : null,
      })),
    });
  }

  // Operator (franchisee / independent): locations + crew assignments by location
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('id, name, address, city, state, zip, latitude, longitude')
    .eq('org_id', orgId);
  if (locError) {
    return NextResponse.json({ error: locError.message }, { status: 500 });
  }

  const { data: assignments, error: assignError } = await supabase
    .from('crew_assignments')
    .select('location_id, crews(name)')
    .eq('org_id', orgId)
    .eq('is_active', true);
  if (assignError) {
    return NextResponse.json({ error: assignError.message }, { status: 500 });
  }

  const locationList = (locations ?? []).map((loc) => ({
    id: loc.id,
    name: loc.name,
    address: [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ') || null,
    latitude: loc.latitude != null ? Number(loc.latitude) : null,
    longitude: loc.longitude != null ? Number(loc.longitude) : null,
  }));

  const crewByLocation = (assignments ?? []).map((a) => ({
    locationId: a.location_id,
    crewName: (a.crews as { name: string } | null)?.name ?? 'Crew',
  }));

  return NextResponse.json({
    orgType: orgType === 'franchisee' ? 'franchisee' : 'independent',
    locations: locationList,
    crewAssignments: crewByLocation,
  });
}
