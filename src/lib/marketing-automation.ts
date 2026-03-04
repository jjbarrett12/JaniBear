/**
 * Marketing automation service: email sequences, enrollments,
 * step processing, and event tracking.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import type {
  EmailSequence,
  EmailSequenceStep,
  EmailSequenceEnrollment,
  EmailTemplate,
  SequenceStats,
} from '@/types/features';

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getEmailTemplates(orgId: string, category?: string): Promise<EmailTemplate[]> {
  const supabase = await createClient();
  let query = supabase
    .from('email_templates')
    .select('*')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as EmailTemplate[];
}

export async function createEmailTemplate(orgId: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('email_templates')
    .insert({
      org_id: orgId,
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      category: template.category ?? 'general',
      variables: template.variables ?? [],
      created_by: template.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmailTemplate;
}

// ─── Sequences ───────────────────────────────────────────────────────────────

export async function getSequences(orgId: string): Promise<EmailSequence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*, email_sequence_steps(count)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as EmailSequence[];
}

export async function getSequenceWithSteps(id: string): Promise<EmailSequence | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*, email_sequence_steps(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as EmailSequence;
}

export async function createSequence(orgId: string, seq: Partial<EmailSequence>): Promise<EmailSequence> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('email_sequences')
    .insert({
      org_id: orgId,
      name: seq.name,
      description: seq.description,
      trigger_type: seq.trigger_type ?? 'manual',
      status: 'draft',
      created_by: seq.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmailSequence;
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

export async function enrollContact(
  orgId: string,
  sequenceId: string,
  contactEmail: string,
  contactName?: string,
  leadId?: string,
  enrolledBy?: string
): Promise<EmailSequenceEnrollment> {
  const supabase = await createClient();

  const { data: steps } = await supabase
    .from('email_sequence_steps')
    .select('delay_days, delay_hours')
    .eq('sequence_id', sequenceId)
    .eq('step_order', 1)
    .single();

  const delayMs = ((steps?.delay_days ?? 0) * 86400000) + ((steps?.delay_hours ?? 0) * 3600000);
  const nextStepAt = new Date(Date.now() + delayMs).toISOString();

  const { data, error } = await supabase
    .from('email_sequence_enrollments')
    .insert({
      org_id: orgId,
      sequence_id: sequenceId,
      lead_id: leadId,
      contact_email: contactEmail,
      contact_name: contactName,
      current_step: 0,
      status: 'active',
      next_step_at: nextStepAt,
      enrolled_by: enrolledBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data as EmailSequenceEnrollment;
}

/** Replace template variables like {{first_name}}, {{company}}, etc. */
function interpolateTemplate(html: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value),
    html
  );
}

/**
 * Process all due sequence steps. Called by cron.
 * Finds enrollments where next_step_at <= now, executes the step, advances.
 */
export async function processSequenceSteps(): Promise<{ processed: number; errors: string[] }> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: enrollments, error } = await supabase
    .from('email_sequence_enrollments')
    .select('*, email_sequences(name, status)')
    .eq('status', 'active')
    .lte('next_step_at', now)
    .limit(100);

  if (error) return { processed: 0, errors: [error.message] };
  if (!enrollments?.length) return { processed: 0, errors: [] };

  let processed = 0;
  const errors: string[] = [];

  for (const enrollment of enrollments) {
    try {
      const seq = enrollment.email_sequences as { name: string; status: string } | null;
      if (seq?.status !== 'active') {
        await supabase
          .from('email_sequence_enrollments')
          .update({ status: 'paused' })
          .eq('id', enrollment.id);
        continue;
      }

      const nextStepOrder = enrollment.current_step + 1;
      const { data: step } = await supabase
        .from('email_sequence_steps')
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', nextStepOrder)
        .single();

      if (!step) {
        await supabase
          .from('email_sequence_enrollments')
          .update({ status: 'completed', completed_at: now })
          .eq('id', enrollment.id);
        processed++;
        continue;
      }

      if (step.step_type === 'email') {
        let html = step.body_html ?? '';
        if (step.template_id) {
          const { data: tmpl } = await supabase
            .from('email_templates')
            .select('body_html, subject')
            .eq('id', step.template_id)
            .single();
          if (tmpl) html = tmpl.body_html;
        }

        const vars = {
          first_name: enrollment.contact_name?.split(' ')[0] ?? '',
          name: enrollment.contact_name ?? '',
          email: enrollment.contact_email,
        };
        html = interpolateTemplate(html, vars);

        await sendEmail({
          to: enrollment.contact_email,
          subject: step.subject ?? 'Following up',
          html,
        });

        await supabase.from('email_sequence_events').insert({
          enrollment_id: enrollment.id,
          step_id: step.id,
          event_type: 'sent',
          occurred_at: now,
        });
      }

      const { data: nextStep } = await supabase
        .from('email_sequence_steps')
        .select('delay_days, delay_hours')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', nextStepOrder + 1)
        .single();

      const delayMs = nextStep
        ? ((nextStep.delay_days ?? 0) * 86400000) + ((nextStep.delay_hours ?? 0) * 3600000)
        : 0;
      const nextAt = nextStep ? new Date(Date.now() + delayMs).toISOString() : null;

      await supabase
        .from('email_sequence_enrollments')
        .update({
          current_step: nextStepOrder,
          next_step_at: nextAt,
          ...(nextAt ? {} : { status: 'completed', completed_at: now }),
        })
        .eq('id', enrollment.id);

      processed++;
    } catch (err) {
      errors.push(`Enrollment ${enrollment.id}: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  return { processed, errors };
}

/** Compute stats for a specific sequence. */
export async function getSequenceStats(sequenceId: string): Promise<SequenceStats> {
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from('email_sequence_enrollments')
    .select('id, status')
    .eq('sequence_id', sequenceId);

  const all = enrollments ?? [];
  const total = all.length;
  const active = all.filter((e) => e.status === 'active').length;
  const completed = all.filter((e) => e.status === 'completed').length;
  const replied = all.filter((e) => e.status === 'replied').length;
  const bounced = all.filter((e) => e.status === 'bounced').length;

  const ids = all.map((e) => e.id);
  let openRate: number | null = null;
  let clickRate: number | null = null;

  if (ids.length > 0) {
    const { data: events } = await supabase
      .from('email_sequence_events')
      .select('event_type, enrollment_id')
      .in('enrollment_id', ids);

    const evts = events ?? [];
    const sentCount = evts.filter((e) => e.event_type === 'sent').length;
    const openedCount = new Set(evts.filter((e) => e.event_type === 'opened').map((e) => e.enrollment_id)).size;
    const clickedCount = new Set(evts.filter((e) => e.event_type === 'clicked').map((e) => e.enrollment_id)).size;

    openRate = sentCount > 0 ? openedCount / sentCount : null;
    clickRate = sentCount > 0 ? clickedCount / sentCount : null;
  }

  return {
    total_enrolled: total,
    active,
    completed,
    replied,
    bounced,
    open_rate: openRate,
    click_rate: clickRate,
    reply_rate: total > 0 ? replied / total : null,
  };
}
