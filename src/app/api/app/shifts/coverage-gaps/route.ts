import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getCoverageGapsForDate } from '@/lib/shifts/coverage-gaps-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app/shifts/coverage-gaps?date=YYYY-MM-DD
 * Returns shift_coverage rows with coverage_status = coverage_needed for the date.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ?? new Date().toISOString().slice(0, 10);

    const gaps = await getCoverageGapsForDate(orgId, date);
    return NextResponse.json({ data: gaps });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
