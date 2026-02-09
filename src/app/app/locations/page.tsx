import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin } from 'lucide-react';
import { LocationsListWithFilter } from '@/components/locations/locations-list-with-filter';

export default async function LocationsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, address, city, state, square_footage, status')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Locations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your buildings and accounts (active & inactive)</p>
        </div>
        <Link href="/app/locations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Location
          </Button>
        </Link>
      </div>

      {locations && locations.length > 0 ? (
        <LocationsListWithFilter locations={locations} hasNewButton />
      ) : (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No locations yet</p>
            <Link href="/app/locations/new">
              <Button>Create Your First Location</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
