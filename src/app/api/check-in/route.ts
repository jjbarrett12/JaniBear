import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { checkIn, checkOut } from '@/lib/route-optimization';

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const { type, facility_id, latitude, longitude, accuracy, photo_url, route_stop_id } = body;

  if (!facility_id || latitude == null || longitude == null) {
    return NextResponse.json(
      { error: 'facility_id, latitude, and longitude are required' },
      { status: 400 }
    );
  }

  const fn = type === 'out' ? checkOut : checkIn;
  const result = await fn(
    guard.context.activeOrgId!,
    guard.context.userId,
    facility_id,
    latitude,
    longitude,
    accuracy ?? 0,
    ...(type === 'out' ? [route_stop_id] : [photo_url, route_stop_id])
  );

  return NextResponse.json(result, { status: 201 });
}
