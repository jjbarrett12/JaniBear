import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Edit,
  ArrowLeft,
  QrCode,
  Ruler,
  Bath,
  Calendar,
  Key,
  User,
  CreditCard,
  Package,
  FileText,
  FileStack,
  ClipboardList,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';

function InfoRow({
  label,
  value,
  icon: Icon,
  sensitive,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ComponentType<{ className?: string }>;
  sensitive?: boolean;
}) {
  if (value === undefined || value === null || value === '') return null;
  const Icon = icon;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm mt-0.5 ${sensitive ? 'font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded' : ''}`}>
          {String(value)}
        </p>
      </div>
    </div>
  );
}

function JsonSqft({ data }: { data: Record<string, number> | null }) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return null;
  const total = Object.values(data).reduce((a, b) => a + Number(b), 0);
  return (
    <div className="space-y-2">
      {Object.entries(data).map(([type, sqft]) => (
        <div key={type} className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400 capitalize">{type}</span>
          <span className="font-medium">{Number(sqft).toLocaleString()} sq ft</span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-600">
        <span>Total</span>
        <span>{total.toLocaleString()} sq ft</span>
      </div>
    </div>
  );
}

export default async function LocationDashboardPage({
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

  const status = (location as { status?: string }).status ?? 'active';
  const sqftByFlooring = (location as { sqft_by_flooring_type?: Record<string, number> }).sqft_by_flooring_type ?? null;
  const otherDocs = (location as { other_documents?: { name: string; path?: string; url?: string }[] }).other_documents;
  const suppliesUsed = (location as { types_of_supplies_used?: string[] }).types_of_supplies_used;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/app/locations">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {location.name}
              </h1>
              <Badge
                className={
                  status === 'active'
                    ? 'bg-emerald-600'
                    : 'bg-amber-600/80 text-white'
                }
              >
                {status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Location dashboard</p>
          </div>
        </div>
        <Link href={`/app/locations/${location.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Address & basics */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address & basics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Address"
              value={
                [location.address, location.city, location.state, location.zip]
                  .filter(Boolean)
                  .join(', ') || undefined
              }
            />
            <InfoRow label="Square footage (total)" value={location.square_footage ? `${location.square_footage.toLocaleString()} sq ft` : undefined} icon={Ruler} />
            <InfoRow label="Notes" value={location.notes ?? undefined} />
          </CardContent>
        </Card>

        {/* Square footage by flooring type */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Square footage by flooring type
            </CardTitle>
            <CardDescription>Breakdown by surface type</CardDescription>
          </CardHeader>
          <CardContent>
            {sqftByFlooring ? (
              <JsonSqft data={sqftByFlooring} />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Not set. Edit location to add.</p>
            )}
          </CardContent>
        </Card>

        {/* Service details */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Service details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Restrooms" value={(location as { restroom_count?: number }).restroom_count ?? undefined} icon={Bath} />
            <InfoRow label="Days of service" value={(location as { days_of_service?: string }).days_of_service ?? undefined} icon={Calendar} />
            <InfoRow label="Door / alarm code" value={(location as { door_alarm_code?: string }).door_alarm_code ?? undefined} icon={Key} sensitive />
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Name" value={(location as { contact_name?: string }).contact_name ?? undefined} />
            <InfoRow label="Phone" value={(location as { contact_phone?: string }).contact_phone ?? undefined} icon={Phone} />
            <InfoRow label="Email" value={(location as { contact_email?: string }).contact_email ?? undefined} icon={Mail} />
          </CardContent>
        </Card>

        {/* Billing info */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow label="Billing contact" value={(location as { billing_contact_name?: string }).billing_contact_name ?? undefined} />
            <InfoRow label="Billing phone" value={(location as { billing_contact_phone?: string }).billing_contact_phone ?? undefined} icon={Phone} />
            <InfoRow label="Billing email" value={(location as { billing_contact_email?: string }).billing_contact_email ?? undefined} icon={Mail} />
            <InfoRow label="Billing address" value={(location as { billing_address?: string }).billing_address ?? undefined} />
            <InfoRow label="Billing notes" value={(location as { billing_notes?: string }).billing_notes ?? undefined} />
            <InfoRow label="Account billing notes" value={(location as { account_billing_notes?: string }).account_billing_notes ?? undefined} />
          </CardContent>
        </Card>

        {/* Supplies */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Supplies
            </CardTitle>
            <CardDescription>Authorization & types used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <InfoRow
              label="Authorized to order supplies"
              value={(location as { authorized_to_order_supplies?: boolean }).authorized_to_order_supplies ? 'Yes' : 'No'}
            />
            {suppliesUsed && suppliesUsed.length > 0 ? (
              <div className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Types of supplies used</p>
                <p className="text-sm mt-1">{suppliesUsed.join(', ')}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Contract & documents */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract & documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {(location as { contract_storage_path?: string }).contract_storage_path && (
              <div className="py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contract on file</p>
                <p className="text-sm mt-1 truncate">Uploaded</p>
              </div>
            )}
            {otherDocs && Array.isArray(otherDocs) && otherDocs.length > 0 ? (
              otherDocs.map((doc: { name?: string; path?: string; url?: string }, i: number) => (
                <div key={i} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <p className="text-sm font-medium">{doc.name ?? 'Document'}</p>
                </div>
              ))
            ) : null}
            {!((location as { contract_storage_path?: string }).contract_storage_path) && (!otherDocs || otherDocs.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No contract or other documents. Edit location to add.</p>
            )}
            <div className="pt-2">
              <Link href={`/app/contracts?location=${location.id}`}>
                <Button variant="outline" size="sm">
                  <FileStack className="h-4 w-4 mr-2" />
                  View contracts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Special instructions */}
        {(location as { special_instructions?: string }).special_instructions && (
          <Card className="dark:bg-gray-800 dark:border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Special instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{(location as { special_instructions?: string }).special_instructions}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick actions */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Quick actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/schedules?location=${location.id}`}>
              <Button variant="outline">Schedules</Button>
            </Link>
            <Link href={`/app/inspections?location=${location.id}`}>
              <Button variant="outline">Inspections</Button>
            </Link>
            <Link href={`/app/issues?location=${location.id}`}>
              <Button variant="outline">Issues</Button>
            </Link>
            <Link href={`/app/tickets?location=${location.id}`}>
              <Button variant="outline">Service tickets</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* QR code */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Service request QR code
          </CardTitle>
          <CardDescription>
            Place this QR at the location so customers or staff can scan to submit a service request.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
