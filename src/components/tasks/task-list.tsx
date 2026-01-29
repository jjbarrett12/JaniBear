'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Clock, MapPin, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TaskListProps {
  tasks: any[];
  completedTasks: any[];
}

export function TaskList({ tasks, completedTasks }: TaskListProps) {
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setCompletingTaskId(null);
      return;
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!membership) {
      setCompletingTaskId(null);
      return;
    }

    try {
      await supabase.from('task_completions').insert({
        org_id: membership.org_id,
        task_assignment_id: taskId,
      });

      // Refresh page
      window.location.reload();
    } catch (err: any) {
      alert('Failed to complete task: ' + err.message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600 mt-1">Your assigned cleaning tasks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {task.schedules?.locations?.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {task.template_items?.label}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      Due: {formatDate(task.due_date)}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={completingTaskId === task.id}
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
          )}
        </CardContent>
      </Card>

      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="font-medium line-through text-gray-500">
                        {task.template_items?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {task.schedules?.locations?.name} • {formatDate(task.due_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
