import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, MapPin } from 'lucide-react';

export default async function LocationsPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage your buildings and accounts</p>
        </div>
        <Link href="/app/locations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Location
          </Button>
        </Link>
      </div>

      {locations && locations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Link key={location.id} href={`/app/locations/${location.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>{location.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {location.address && (
                    <p className="text-sm text-gray-600">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && ` ${location.state}`}
                    </p>
                  )}
                  {location.square_footage && (
                    <p className="text-sm text-gray-500 mt-2">
                      {location.square_footage.toLocaleString()} sq ft
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No locations yet</p>
            <Link href="/app/locations/new">
              <Button>Create Your First Location</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
