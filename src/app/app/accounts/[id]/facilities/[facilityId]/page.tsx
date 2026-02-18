import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Edit, ArrowLeft, Key, FileText, ClipboardList, QrCode } from 'lucide-react';

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm mt-0.5 whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  );
}

export default async function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string; facilityId: string }>;
}) {
  const { id: accountId, facilityId } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  const { data: facility } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .eq('account_id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account || !facility) notFound();

  const addressLine = [facility.address_line1, facility.city, facility.state, facility.zip]
    .filter(Boolean)
    .join(', ') || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/app/accounts/${accountId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{facility.name}</h1>
              {facility.is_primary && (
                <Badge variant="secondary">Primary</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Facility · {account.name}
            </p>
          </div>
        </div>
        <Link href={`/app/accounts/${accountId}/facilities/${facilityId}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit facility
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Address" value={addressLine} />
            <InfoRow label="Timezone" value={facility.timezone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Access & service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Access notes" value={facility.access_notes} icon={Key} />
            <InfoRow label="Service notes" value={facility.service_notes} icon={FileText} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Quick actions
          </CardTitle>
          <CardDescription>Inspections, schedules, and tickets for this facility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/schedules?facility=${facilityId}`}>
              <Button variant="outline">Schedules</Button>
            </Link>
            <Link href={`/app/inspections?facility=${facilityId}`}>
              <Button variant="outline">Inspections</Button>
            </Link>
            <Link href={`/app/issues?facility=${facilityId}`}>
              <Button variant="outline">Issues</Button>
            </Link>
            <Link href={`/app/tickets?facility=${facilityId}`}>
              <Button variant="outline">Service tickets</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Service request QR code
          </CardTitle>
          <CardDescription>
            Place this QR at the facility so customers or staff can scan to submit a service request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-40 h-40 shrink-0 bg-white rounded-lg border flex items-center justify-center p-2">
              <Image
                src={`/api/qr?facility=${facilityId}`}
                alt={`QR code for ${facility.name}`}
                width={160}
                height={160}
                unoptimized
                className="object-contain"
              />
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="font-medium text-foreground mb-1">Ticket submission link</p>
              <p className="text-muted-foreground break-all">
                {typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
                  ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/ticket/${facilityId}`
                  : `/ticket/${facilityId}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
