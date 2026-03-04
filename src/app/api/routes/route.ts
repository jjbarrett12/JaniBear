import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import { getRoutePlans, createRoutePlan } from '@/lib/route-optimization';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') ?? undefined;
  const routes = await getRoutePlans(guard.context.activeOrgId!, date);
  return NextResponse.json(routes);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const route = await createRoutePlan(
    guard.context.activeOrgId!,
    body,
    body.facility_ids ?? [],
    guard.context.userId
  );

  return NextResponse.json(route, { status: 201 });
}
