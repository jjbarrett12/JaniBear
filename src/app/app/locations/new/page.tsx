import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { LocationForm } from '@/components/locations/location-form';

export default async function NewLocationPage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Location</h1>
        <p className="text-gray-600 mt-1">Add a new building or account</p>
      </div>
      <LocationForm />
    </div>
  );
}
