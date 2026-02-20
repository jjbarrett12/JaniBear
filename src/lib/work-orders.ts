/**
 * Work order service: CRUD, status transitions, auto-creation from
 * inspections/tickets, and SLA tracking.
 */
import { createClient } from '@/lib/supabase/server';
import { logActivity, createNotification } from '@/lib/activity-logger';
import type { WorkOrder, WorkOrderStats } from '@/types/features';

const WO_SELECT = `
  *,
  facilities(name),
  accounts(name),
  work_order_items(*),
  work_order_photos(*)
`;

export async function getWorkOrders(orgId: string, filters?: {
  status?: string;
  priority?: string;
  facility_id?: string;
  assigned_to?: string;
}): Promise<WorkOrder[]> {
  const supabase = await createClient();
  let query = supabase
    .from('work_orders')
    .select(WO_SELECT)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.priority) query = query.eq('priority', filters.priority);
  if (filters?.facility_id) query = query.eq('facility_id', filters.facility_id);
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as WorkOrder[];
}

export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_orders')
    .select(WO_SELECT)
    .eq('id', id)
    .single();

  if (error) return null;
  return data as WorkOrder;
}

export async function createWorkOrder(orgId: string, wo: Partial<WorkOrder>, userId?: string): Promise<WorkOrder> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_orders')
    .insert({
      org_id: orgId,
      title: wo.title,
      description: wo.description,
      facility_id: wo.facility_id,
      account_id: wo.account_id,
      site_id: wo.site_id,
      issue_id: wo.issue_id,
      assigned_to: wo.assigned_to,
      crew_id: wo.crew_id,
      due_at: wo.due_at,
      sla_deadline: wo.sla_deadline,
      estimated_duration_min: wo.estimated_duration_min,
      status: 'pending',
      priority: wo.priority ?? 'medium',
      category: wo.category,
      source: wo.source ?? 'manual',
      source_id: wo.source_id,
      notes: wo.notes,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    orgId, userId, entityType: 'work_order', entityId: data.id, action: 'created',
    details: { title: wo.title, priority: wo.priority, source: wo.source },
  });

  if (wo.assigned_to) {
    await createNotification({
      orgId, userId: wo.assigned_to, type: 'task',
      title: 'New Work Order Assigned',
      message: `Work order "${wo.title}" has been assigned to you.`,
      link: `/app/work-orders/${data.id}`,
    });
  }

  return data as WorkOrder;
}

export async function updateWorkOrderStatus(
  id: string,
  orgId: string,
  status: string,
  userId?: string
): Promise<void> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };

  if (status === 'in_progress' && !updates.started_at) {
    updates.started_at = new Date().toISOString();
  }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('work_orders').update(updates).eq('id', id);
  if (error) throw error;

  await logActivity({
    orgId, userId, entityType: 'work_order', entityId: id, action: 'status_changed',
    details: { new_status: status },
  });
}

/** Auto-create a work order from a failed inspection item. */
export async function createFromInspection(
  orgId: string,
  issueId: string,
  facilityId: string,
  title: string,
  description: string,
  userId?: string
): Promise<WorkOrder> {
  return createWorkOrder(orgId, {
    title,
    description,
    facility_id: facilityId,
    issue_id: issueId,
    source: 'inspection',
    source_id: issueId,
    priority: 'high',
    category: 'inspection_followup',
  }, userId);
}

/** Auto-create a work order from a service ticket. */
export async function createFromTicket(
  orgId: string,
  ticketId: string,
  facilityId: string | null,
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  userId?: string
): Promise<WorkOrder> {
  return createWorkOrder(orgId, {
    title,
    description,
    facility_id: facilityId,
    source: 'ticket',
    source_id: ticketId,
    priority,
    category: 'complaint',
  }, userId);
}

export async function getWorkOrderStats(orgId: string): Promise<WorkOrderStats> {
  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [allResult, completedResult] = await Promise.all([
    supabase
      .from('work_orders')
      .select('id, status, sla_deadline, actual_duration_min')
      .eq('org_id', orgId),
    supabase
      .from('work_orders')
      .select('id, actual_duration_min')
      .eq('org_id', orgId)
      .eq('status', 'completed')
      .gte('completed_at', todayStart),
  ]);

  const all = allResult.data ?? [];
  const completedToday = completedResult.data ?? [];

  const pending = all.filter((w) => w.status === 'pending' || w.status === 'assigned').length;
  const inProgress = all.filter((w) => w.status === 'in_progress').length;
  const overdueSla = all.filter(
    (w) => w.sla_deadline && new Date(w.sla_deadline) < now && !['completed', 'cancelled'].includes(w.status)
  ).length;

  const durations = all
    .filter((w) => w.status === 'completed' && w.actual_duration_min)
    .map((w) => w.actual_duration_min!);
  const avgCompletion = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  return {
    total: all.length,
    pending,
    in_progress: inProgress,
    completed_today: completedToday.length,
    overdue_sla: overdueSla,
    avg_completion_min: avgCompletion,
  };
}
