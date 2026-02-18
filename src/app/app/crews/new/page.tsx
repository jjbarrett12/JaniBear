import { requireOrg } from '@/lib/auth';
import { CrewForm } from '@/components/crews/crew-form';

export default async function NewCrewPage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New Crew</h1>
        <p className="text-muted-foreground mt-1">Create a new cleaning crew</p>
      </div>
      <CrewForm />
    </div>
  );
}
