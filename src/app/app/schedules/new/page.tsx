import { requireOrg } from '@/lib/auth';
import { ScheduleForm } from '@/components/schedules/schedule-form';

export default async function NewSchedulePage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New Schedule</h1>
        <p className="text-muted-foreground mt-1">Create a new inspection schedule</p>
      </div>
      <ScheduleForm />
    </div>
  );
}
