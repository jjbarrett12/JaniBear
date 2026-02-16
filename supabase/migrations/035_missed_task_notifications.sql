-- Expected time (of day) when tasks at a location are normally completed.
-- Used to send "missed task" notifications 1 hour after this time if not completed.
ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS expected_completion_time TIME DEFAULT '17:00';

COMMENT ON COLUMN schedules.expected_completion_time IS 'Time of day (org local) when tasks are normally done; missed-task notification fires 1 hour after this on due_date.';

-- Link notification to task_assignment to avoid duplicate "missed task" notifications.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS task_assignment_id UUID REFERENCES task_assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_task_assignment_id ON notifications(task_assignment_id);

COMMENT ON COLUMN notifications.task_assignment_id IS 'When type=task, optional link to task_assignment for deduplication (e.g. missed-task notifications).';

-- Allow org members to create notifications (e.g. for other users in the org); cron uses service role and bypasses RLS.
DROP POLICY IF EXISTS "Org members can create notifications" ON notifications;
CREATE POLICY "Org members can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );
