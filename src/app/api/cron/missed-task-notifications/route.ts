import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_COMPLETION_TIME = '17:00'; // 5 PM
const MISSED_BUFFER_HOURS = 1;

/**
 * GET/POST /api/cron/missed-task-notifications
 *
 * Call periodically (e.g. every 15–30 min) to send notifications for tasks that
 * were due to be completed at a building's "expected completion time" and are
 * still not completed 1 hour after that time.
 *
 * Secured by CRON_SECRET: pass ?secret=CRON_SECRET or header x-cron-secret.
 */
export async function GET(request: NextRequest) {
  return runMissedTaskCheck(request);
}

export async function POST(request: NextRequest) {
  return runMissedTaskCheck(request);
}

async function runMissedTaskCheck(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const now = new Date();

    // Task assignments with due_date up to today, with schedule + location, and no completion
    const { data: assignments, error: assignError } = await supabase
      .from('task_assignments')
      .select(
        `
        id,
        org_id,
        assigned_user_id,
        due_date,
        schedule_id,
        schedules (
          expected_completion_time,
          location_id,
          locations ( name )
        )
      `
      )
      .lte('due_date', now.toISOString().slice(0, 10));

    if (assignError) {
      console.error('missed-task-notifications: task_assignments query failed', assignError);
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    if (!assignments?.length) {
      return NextResponse.json({ ok: true, sent: 0 });
    }

    // Get all task_assignment_ids that have a completion
    const { data: completions } = await supabase
      .from('task_completions')
      .select('task_assignment_id')
      .in('task_assignment_id', assignments.map((a) => a.id));

    const completedIds = new Set((completions ?? []).map((c) => c.task_assignment_id));

    // Get all task_assignment_ids that already have a missed-task notification
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('task_assignment_id')
      .eq('type', 'task')
      .not('task_assignment_id', 'is', null)
      .in('task_assignment_id', assignments.map((a) => a.id));

    const alreadyNotifiedIds = new Set(
      (existingNotifs ?? []).map((n) => n.task_assignment_id).filter(Boolean)
    );

    const locationName = (loc: unknown): string =>
      (loc as { name?: string } | null)?.name ?? 'Building';

    let sent = 0;
    for (const ta of assignments) {
      if (completedIds.has(ta.id) || alreadyNotifiedIds.has(ta.id)) continue;

      const s = ta.schedules as {
        expected_completion_time?: string | null;
        location_id?: string;
        locations?: { name?: string } | null;
      } | null;
      const timeStr = s?.expected_completion_time ?? DEFAULT_COMPLETION_TIME;
      const [hours, minutes] = timeStr.split(':').map(Number);

      const dueDate = new Date(ta.due_date + 'T00:00:00Z');
      const deadline = new Date(dueDate);
      deadline.setUTCHours(hours, minutes ?? 0, 0, 0);
      deadline.setTime(deadline.getTime() + MISSED_BUFFER_HOURS * 60 * 60 * 1000);

      if (now.getTime() < deadline.getTime()) continue;

      const locationLabel = locationName(s?.locations ?? null);
      const { error: insertError } = await supabase.from('notifications').insert({
        org_id: ta.org_id,
        user_id: ta.assigned_user_id,
        type: 'task',
        title: 'Task missed',
        message: `Task at ${locationLabel} was due to be completed over an hour ago and is still not done.`,
        link: '/app/schedules',
        task_assignment_id: ta.id,
      });

      if (insertError) {
        console.error('missed-task-notifications: insert failed for', ta.id, insertError);
        continue;
      }
      sent++;
      alreadyNotifiedIds.add(ta.id);
    }

    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    console.error('missed-task-notifications:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
