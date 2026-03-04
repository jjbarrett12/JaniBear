import { NextResponse } from 'next/server';
import { requireApiOrg } from '@/lib/api-guard';
import {
  getBillingSchedules,
  createBillingSchedule,
  getBillingStats,
} from '@/lib/recurring-billing';

export async function GET(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view');

  if (view === 'stats') {
    const stats = await getBillingStats(guard.context.activeOrgId!);
    return NextResponse.json(stats);
  }

  const schedules = await getBillingSchedules(guard.context.activeOrgId!);
  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const guard = await requireApiOrg();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const schedule = await createBillingSchedule(guard.context.activeOrgId!, {
    ...body,
    created_by: guard.context.userId,
  });

  return NextResponse.json(schedule, { status: 201 });
}
