import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationForm } from '@/components/locations/location-form';
import { MapPin, Edit, ArrowLeft, QrCode } from 'lucide-react';
import Image from 'next/image';

export default async function LocationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', params.id)
    .eq('org_id', org.org_id)
    .single();

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/locations">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
          <p className="text-gray-600 mt-1">Location Details</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Details</CardTitle>
              <Link href={`/app/locations/${location.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {location.address && (
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm">
                  {location.address}
                  {location.city && `, ${location.city}`}
                  {location.state && ` ${location.state}`}
                  {location.zip && ` ${location.zip}`}
                </p>
              </div>
            )}
            {location.square_footage && (
              <div>
                <p className="text-sm font-medium text-gray-500">Square Footage</p>
                <p className="text-sm">{location.square_footage.toLocaleString()} sq ft</p>
              </div>
            )}
            {location.notes && (
              <div>
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{location.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/app/schedules?location=${location.id}`}>
              <Button variant="outline" className="w-full justify-start">
                View Schedules
              </Button>
            </Link>
            <Link href={`/app/inspections?location=${location.id}`}>
              <Button variant="outline" className="w-full justify-start">
                View Inspections
              </Button>
            </Link>
            <Link href={`/app/issues?location=${location.id}`}>
              <Button variant="outline" className="w-full justify-start">
                View Issues
              </Button>
            </Link>
            <Link href={`/app/tickets?location=${location.id}`}>
              <Button variant="outline" className="w-full justify-start">
                View Service Tickets
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <CardTitle>Service request QR code</CardTitle>
            </div>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Place this QR at the location so customers or staff can scan to submit a service request. Each scan creates a ticket in Service Tickets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-40 h-40 shrink-0 bg-white rounded-lg border flex items-center justify-center p-2">
                <Image
                  src={`/api/qr?location=${location.id}`}
                  alt={`QR code for ${location.name}`}
                  width={160}
                  height={160}
                  unoptimized
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Ticket submission link</p>
                <p className="text-gray-600 dark:text-gray-400 break-all">
                  {typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
                    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/ticket/${location.id}`
                    : `/ticket/${location.id}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Scan the QR or open the link to request service for this location.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
