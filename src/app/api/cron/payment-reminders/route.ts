import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { startCronRun, finishCronRun } from '@/lib/observability';

/**
 * GET/POST /api/cron/payment-reminders
 *
 * Run every few hours to send pending payment reminders whose
 * scheduled_for time has passed.
 *
 * Secured by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  return runReminderCron(request);
}

export async function POST(request: NextRequest) {
  return runReminderCron(request);
}

async function runReminderCron(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-cron-secret') ||
    '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startCronRun('payment-reminders');
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: reminders, error } = await supabase
      .from('payment_reminders')
      .select('*, invoices(invoice_number, total_amount, due_date)')
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(100);

    if (error) {
      await finishCronRun(runId, 'failure', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    for (const reminder of reminders ?? []) {
      if (!reminder.recipient_email) continue;

      const inv = reminder.invoices as {
        invoice_number: string;
        total_amount: number;
        due_date: string;
      } | null;

      const labels: Record<string, string> = {
        upcoming: 'Payment Reminder: Invoice Due Soon',
        due: 'Payment Due Today',
        overdue_3d: 'Payment Overdue — 3 Days Past Due',
        overdue_7d: 'Payment Overdue — 7 Days Past Due',
        overdue_14d: 'Payment Overdue — 14 Days Past Due',
        overdue_30d: 'URGENT: Payment 30+ Days Overdue',
      };

      try {
        await sendEmail({
          to: reminder.recipient_email,
          subject: labels[reminder.reminder_type] || 'Payment Reminder',
          html: `
            <p>This is a reminder regarding invoice <strong>${inv?.invoice_number ?? 'N/A'}</strong>.</p>
            <p>Amount: <strong>$${inv?.total_amount?.toFixed(2) ?? '0.00'}</strong></p>
            <p>Due date: <strong>${inv?.due_date ?? 'N/A'}</strong></p>
            <p>Please submit payment at your earliest convenience. Thank you!</p>
          `,
        });

        await supabase
          .from('payment_reminders')
          .update({ status: 'sent', sent_at: now })
          .eq('id', reminder.id);

        sent++;
      } catch (err) {
        await supabase
          .from('payment_reminders')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Send failed',
          })
          .eq('id', reminder.id);
      }
    }

    await finishCronRun(runId, 'success');
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await finishCronRun(runId, 'failure', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
