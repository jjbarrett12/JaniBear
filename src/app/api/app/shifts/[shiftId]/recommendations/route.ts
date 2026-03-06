import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import { recommendShiftBackup } from '@/lib/shifts/recommendBackup';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app/shifts/[shiftId]/recommendations
 * Returns top 3 backup recommendations for this shift coverage gap.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { shiftId } = await params;
    const supabase = await createClient();
    const { data: shift, error } = await supabase
      .from('shift_coverage')
      .select('id, org_id, facility_id, account_id, shift_date, primary_operator_id')
      .eq('id', shiftId)
      .eq('org_id', orgId)
      .single();

    if (error || !shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const row = shift as {
      facility_id: string | null;
      account_id: string;
      shift_date: string;
      primary_operator_id: string | null;
    };

    let facilityId = row.facility_id;
    let facility_lat = 0;
    let facility_lng = 0;
    let territory_id: string | null = null;

    if (row.facility_id) {
      const { data: fac } = await supabase
        .from('facilities')
        .select('latitude, longitude, territory_id')
        .eq('id', row.facility_id)
        .single();
      if (fac) {
        const f = fac as { latitude?: number | null; longitude?: number | null; territory_id?: string | null };
        facility_lat = f.latitude ?? 0;
        facility_lng = f.longitude ?? 0;
        territory_id = f.territory_id ?? null;
      }
    }
    if (facility_lat === 0 && facility_lng === 0) {
      const { data: fac } = await supabase
        .from('facilities')
        .select('id, latitude, longitude, territory_id')
        .eq('account_id', row.account_id)
        .eq('org_id', orgId)
        .not('latitude', 'is', null)
        .limit(1)
        .maybeSingle();
      if (fac) {
        const f = fac as { id: string; latitude: number; longitude: number; territory_id?: string | null };
        facilityId = f.id;
        facility_lat = f.latitude;
        facility_lng = f.longitude;
        territory_id = f.territory_id ?? null;
      }
    }

    const list = await recommendShiftBackup({
      org_id: orgId,
      facility_id: facilityId ?? '',
      territory_id,
      facility_lat,
      facility_lng,
      shift_date: row.shift_date,
      exclude_operator_id: row.primary_operator_id,
      limit: 3,
    });

    return NextResponse.json({ data: list });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
