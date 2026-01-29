import { requireOrg } from '@/lib/auth';
import { CrewForm } from '@/components/crews/crew-form';

export default async function NewCrewPage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Crew</h1>
        <p className="text-gray-600 mt-1">Create a new cleaning crew</p>
      </div>
      <CrewForm />
    </div>
  );
}
