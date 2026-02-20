/**
 * Recurring billing service: generates invoices from billing schedules,
 * manages payment reminders, and computes AR aging.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  RecurringBillingSchedule,
  RecurringBillingStats,
  ARAgingBucket,
  PaymentReminder,
} from '@/types/features';

/** Compute the next invoice date from the current one based on frequency. */
export function computeNextInvoiceDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

/** Fetch all active billing schedules for an org. */
export async function getBillingSchedules(orgId: string): Promise<RecurringBillingSchedule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recurring_billing_schedules')
    .select('*, accounts(name, billing_email), facilities(name)')
    .eq('org_id', orgId)
    .order('next_invoice_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as RecurringBillingSchedule[];
}

/** Create a new recurring billing schedule. */
export async function createBillingSchedule(
  orgId: string,
  schedule: Partial<RecurringBillingSchedule>
): Promise<RecurringBillingSchedule> {
  const supabase = await createClient();

  const startsAt = schedule.starts_at ? new Date(schedule.starts_at) : new Date();
  const nextInvoice = computeNextInvoiceDate(startsAt, schedule.frequency ?? 'monthly');

  const { data, error } = await supabase
    .from('recurring_billing_schedules')
    .insert({
      org_id: orgId,
      account_id: schedule.account_id,
      facility_id: schedule.facility_id,
      description: schedule.description,
      frequency: schedule.frequency ?? 'monthly',
      amount_cents: schedule.amount_cents,
      currency: schedule.currency ?? 'USD',
      day_of_month: schedule.day_of_month,
      starts_at: startsAt.toISOString().slice(0, 10),
      next_invoice_at: nextInvoice.toISOString().slice(0, 10),
      auto_send: schedule.auto_send ?? false,
      status: 'active',
      notes: schedule.notes,
      created_by: schedule.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as RecurringBillingSchedule;
}

/**
 * Process due billing schedules: create invoices for all active schedules
 * where next_invoice_at <= today. Called by the cron endpoint.
 */
export async function processDueBillingSchedules(): Promise<{ generated: number; errors: string[] }> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: schedules, error } = await supabase
    .from('recurring_billing_schedules')
    .select('*, accounts(name, billing_email)')
    .eq('status', 'active')
    .lte('next_invoice_at', today);

  if (error) return { generated: 0, errors: [error.message] };
  if (!schedules?.length) return { generated: 0, errors: [] };

  let generated = 0;
  const errors: string[] = [];

  for (const schedule of schedules) {
    try {
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const { error: invoiceError } = await supabase.from('invoices').insert({
        org_id: schedule.org_id,
        invoice_number: invoiceNumber,
        invoice_date: today,
        due_date: dueDate.toISOString().slice(0, 10),
        total_amount: schedule.amount_cents / 100,
        currency: schedule.currency,
        status: schedule.auto_send ? 'sent' : 'draft',
        notes: `Auto-generated from recurring schedule: ${schedule.description || 'Recurring service'}`,
      });

      if (invoiceError) {
        errors.push(`Schedule ${schedule.id}: ${invoiceError.message}`);
        continue;
      }

      const nextDate = computeNextInvoiceDate(new Date(schedule.next_invoice_at), schedule.frequency);
      const isCompleted = schedule.ends_at && nextDate > new Date(schedule.ends_at);

      await supabase
        .from('recurring_billing_schedules')
        .update({
          last_invoiced_at: today,
          next_invoice_at: isCompleted ? null : nextDate.toISOString().slice(0, 10),
          status: isCompleted ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', schedule.id);

      generated++;
    } catch (err) {
      errors.push(`Schedule ${schedule.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return { generated, errors };
}

/** Schedule standard payment reminders for an invoice. */
export async function schedulePaymentReminders(
  orgId: string,
  invoiceId: string,
  dueDate: string,
  recipientEmail: string
): Promise<void> {
  const supabase = await createClient();
  const due = new Date(dueDate);

  const reminders: Array<Partial<PaymentReminder>> = [
    { reminder_type: 'upcoming', scheduled_for: new Date(due.getTime() - 3 * 86400000).toISOString() },
    { reminder_type: 'due', scheduled_for: due.toISOString() },
    { reminder_type: 'overdue_3d', scheduled_for: new Date(due.getTime() + 3 * 86400000).toISOString() },
    { reminder_type: 'overdue_7d', scheduled_for: new Date(due.getTime() + 7 * 86400000).toISOString() },
    { reminder_type: 'overdue_14d', scheduled_for: new Date(due.getTime() + 14 * 86400000).toISOString() },
    { reminder_type: 'overdue_30d', scheduled_for: new Date(due.getTime() + 30 * 86400000).toISOString() },
  ];

  await supabase.from('payment_reminders').insert(
    reminders.map((r) => ({
      org_id: orgId,
      invoice_id: invoiceId,
      reminder_type: r.reminder_type,
      scheduled_for: r.scheduled_for,
      recipient_email: recipientEmail,
      channel: 'email' as const,
      status: 'pending' as const,
    }))
  );
}

/** Compute AR aging buckets for an org. */
export async function getARAging(orgId: string): Promise<ARAgingBucket[]> {
  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, total_amount, due_date, status')
    .eq('org_id', orgId)
    .in('status', ['sent', 'viewed', 'overdue']);

  if (!invoices?.length) return [];

  const now = Date.now();
  const buckets: Record<string, ARAgingBucket> = {
    current: { label: 'Current', count: 0, total_cents: 0 },
    '1_30': { label: '1-30 Days', count: 0, total_cents: 0 },
    '31_60': { label: '31-60 Days', count: 0, total_cents: 0 },
    '61_90': { label: '61-90 Days', count: 0, total_cents: 0 },
    '90_plus': { label: '90+ Days', count: 0, total_cents: 0 },
  };

  for (const inv of invoices) {
    const daysOverdue = Math.max(0, Math.floor((now - new Date(inv.due_date).getTime()) / 86400000));
    const amountCents = Math.round((inv.total_amount ?? 0) * 100);
    let bucket: string;
    if (daysOverdue <= 0) bucket = 'current';
    else if (daysOverdue <= 30) bucket = '1_30';
    else if (daysOverdue <= 60) bucket = '31_60';
    else if (daysOverdue <= 90) bucket = '61_90';
    else bucket = '90_plus';

    buckets[bucket].count++;
    buckets[bucket].total_cents += amountCents;
  }

  return Object.values(buckets);
}

/** Dashboard stats for the billing overview. */
export async function getBillingStats(orgId: string): Promise<RecurringBillingStats> {
  const [schedules, aging] = await Promise.all([
    getBillingSchedules(orgId),
    getARAging(orgId),
  ]);

  const active = schedules.filter((s) => s.status === 'active');
  const totalMrr = active.reduce((sum, s) => {
    const monthly = s.frequency === 'weekly' ? s.amount_cents * 4.33
      : s.frequency === 'biweekly' ? s.amount_cents * 2.17
      : s.frequency === 'quarterly' ? s.amount_cents / 3
      : s.frequency === 'annually' ? s.amount_cents / 12
      : s.amount_cents;
    return sum + monthly;
  }, 0);

  const today = new Date().toISOString().slice(0, 10);
  const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const upcoming = active.filter(
    (s) => s.next_invoice_at && s.next_invoice_at >= today && s.next_invoice_at <= sevenDays
  );

  const overdueTotal = aging.filter((b) => b.label !== 'Current').reduce((sum, b) => sum + b.count, 0);

  return {
    active_schedules: active.length,
    total_mrr_cents: Math.round(totalMrr),
    next_billing_count: upcoming.length,
    overdue_invoices: overdueTotal,
    aging_buckets: aging,
  };
}
