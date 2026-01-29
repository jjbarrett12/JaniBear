import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { TaskList } from '@/components/tasks/task-list';

export default async function TasksPage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get tasks assigned to current user
  const today = new Date().toISOString().split('T')[0];
  const { data: tasks } = await supabase
    .from('task_assignments')
    .select('*, schedules(locations(name), templates(name)), template_items(label, item_type))')
    .eq('assigned_user_id', user.id)
    .gte('due_date', today)
    .order('due_date', { ascending: true });

  // Get completed tasks
  const { data: completedTasks } = await supabase
    .from('task_assignments')
    .select('*, schedules(locations(name), templates(name)), template_items(label, item_type)), task_completions(*)')
    .eq('assigned_user_id', user.id)
    .lt('due_date', today)
    .order('due_date', { ascending: false })
    .limit(20);

  return (
    <TaskList
      tasks={tasks || []}
      completedTasks={completedTasks || []}
    />
  );
}
