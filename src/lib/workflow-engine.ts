/**
 * Workflow automation engine: defines, triggers, and executes
 * "when X happens, do Y" rules.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { logActivity, createNotification } from '@/lib/activity-logger';
import type {
  AutomationWorkflow,
  AutomationTrigger,
  AutomationAction,
  AutomationLog,
  TriggerType,
} from '@/types/features';

// ─── Workflow CRUD ───────────────────────────────────────────────────────────

export async function getWorkflows(orgId: string): Promise<AutomationWorkflow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*, automation_triggers(*), automation_actions(*)')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as AutomationWorkflow[];
}

export async function getWorkflow(id: string): Promise<AutomationWorkflow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('automation_workflows')
    .select('*, automation_triggers(*), automation_actions(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as AutomationWorkflow;
}

export async function createWorkflow(
  orgId: string,
  workflow: Partial<AutomationWorkflow>,
  triggers: Partial<AutomationTrigger>[],
  actions: Partial<AutomationAction>[]
): Promise<AutomationWorkflow> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('automation_workflows')
    .insert({
      org_id: orgId,
      name: workflow.name,
      description: workflow.description,
      status: 'draft',
      created_by: workflow.created_by,
    })
    .select()
    .single();

  if (error) throw error;

  if (triggers.length > 0) {
    await supabase.from('automation_triggers').insert(
      triggers.map((t) => ({
        workflow_id: data.id,
        trigger_type: t.trigger_type,
        conditions: t.conditions ?? {},
        schedule_cron: t.schedule_cron,
      }))
    );
  }

  if (actions.length > 0) {
    await supabase.from('automation_actions').insert(
      actions.map((a, i) => ({
        workflow_id: data.id,
        action_order: i + 1,
        action_type: a.action_type,
        config: a.config ?? {},
      }))
    );
  }

  return (await getWorkflow(data.id))!;
}

// ─── Workflow Execution ──────────────────────────────────────────────────────

/**
 * Fire all active workflows matching a trigger type for an org.
 * Called by other services when events occur (e.g., inspection completed).
 */
export async function fireEvent(
  orgId: string,
  triggerType: TriggerType,
  triggerData: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  const { data: triggers } = await supabase
    .from('automation_triggers')
    .select('*, automation_workflows!inner(id, org_id, status)')
    .eq('trigger_type', triggerType)
    .eq('automation_workflows.org_id', orgId)
    .eq('automation_workflows.status', 'active');

  if (!triggers?.length) return;

  for (const trigger of triggers) {
    const wf = trigger.automation_workflows as { id: string; org_id: string };
    if (!evaluateConditions(trigger.conditions as Record<string, unknown>, triggerData)) continue;

    await executeWorkflow(wf.id, trigger.id, triggerData);
  }
}

function evaluateConditions(
  conditions: Record<string, unknown>,
  data: Record<string, unknown>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [field, expected] of Object.entries(conditions)) {
    if (typeof expected === 'object' && expected !== null) {
      const cond = expected as { operator: string; value: unknown };
      const actual = data[field];
      switch (cond.operator) {
        case 'lt': if (!(Number(actual) < Number(cond.value))) return false; break;
        case 'lte': if (!(Number(actual) <= Number(cond.value))) return false; break;
        case 'gt': if (!(Number(actual) > Number(cond.value))) return false; break;
        case 'gte': if (!(Number(actual) >= Number(cond.value))) return false; break;
        case 'eq': if (actual !== cond.value) return false; break;
        case 'neq': if (actual === cond.value) return false; break;
        default: break;
      }
    } else {
      if (data[field] !== expected) return false;
    }
  }
  return true;
}

async function executeWorkflow(
  workflowId: string,
  triggerId: string,
  triggerData: Record<string, unknown>
): Promise<void> {
  const supabase = createAdminClient();

  const { data: log } = await supabase
    .from('automation_logs')
    .insert({
      workflow_id: workflowId,
      trigger_id: triggerId,
      status: 'started',
      trigger_data: triggerData,
    })
    .select()
    .single();

  if (!log) return;

  try {
    const { data: actions } = await supabase
      .from('automation_actions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('action_order');

    let actionsRun = 0;
    for (const action of actions ?? []) {
      await executeAction(action as AutomationAction, triggerData);
      actionsRun++;
    }

    await supabase
      .from('automation_logs')
      .update({ status: 'completed', actions_run: actionsRun, completed_at: new Date().toISOString() })
      .eq('id', log.id);

    await supabase
      .from('automation_workflows')
      .update({ run_count: supabase.rpc ? undefined : 0, last_run_at: new Date().toISOString() })
      .eq('id', workflowId);

  } catch (err) {
    await supabase
      .from('automation_logs')
      .update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', log.id);
  }
}

async function executeAction(
  action: AutomationAction,
  data: Record<string, unknown>
): Promise<void> {
  const config = action.config;
  const supabase = createAdminClient();

  switch (action.action_type) {
    case 'send_email': {
      const to = (config.to as string) || (data.email as string);
      const subject = interpolate((config.subject as string) || '', data);
      const html = interpolate((config.body_html as string) || '', data);
      if (to) await sendEmail({ to, subject, html });
      break;
    }
    case 'create_task': {
      await supabase.from('task_assignments').insert({
        org_id: data.org_id,
        assigned_user_id: config.assign_to || data.assigned_to,
        due_date: config.due_date || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      });
      break;
    }
    case 'create_work_order': {
      await supabase.from('work_orders').insert({
        org_id: data.org_id,
        title: interpolate((config.title as string) || '', data),
        description: interpolate((config.description as string) || '', data),
        facility_id: data.facility_id,
        priority: config.priority || 'medium',
        source: 'workflow',
        status: 'pending',
      });
      break;
    }
    case 'create_issue': {
      await supabase.from('issues').insert({
        org_id: data.org_id,
        title: interpolate((config.title as string) || '', data),
        description: interpolate((config.description as string) || '', data),
        status: 'open',
        priority: config.priority || 'medium',
      });
      break;
    }
    case 'create_notification': {
      const userId = (config.notify_user as string) || (data.assigned_to as string);
      if (userId) {
        await createNotification({
          orgId: data.org_id as string,
          userId,
          type: 'system',
          title: interpolate((config.title as string) || 'Automation Alert', data),
          message: interpolate((config.message as string) || '', data),
          link: config.link as string,
        });
      }
      break;
    }
    case 'update_status': {
      const table = config.table as string;
      const entityId = (config.entity_id as string) || (data.entity_id as string);
      const newStatus = config.status as string;
      if (table && entityId && newStatus) {
        await supabase.from(table).update({ status: newStatus }).eq('id', entityId);
      }
      break;
    }
    case 'log_activity': {
      await logActivity({
        orgId: data.org_id as string,
        entityType: (config.entity_type as string) || 'workflow',
        entityId: (data.entity_id as string) || '',
        action: (config.action as string) || 'workflow_executed',
        details: data,
      });
      break;
    }
    case 'wait':
      break;
    default:
      break;
  }
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}

// ─── Logs ────────────────────────────────────────────────────────────────────

export async function getWorkflowLogs(
  workflowId: string,
  limit = 50
): Promise<AutomationLog[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('automation_logs')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('started_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as AutomationLog[];
}
