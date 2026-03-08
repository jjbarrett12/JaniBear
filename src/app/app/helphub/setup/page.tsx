import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import { requirePermission } from '@/lib/auth/requirePermission';
import { requireEntitlement } from '@/lib/billing/requireEntitlement';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { isEntitlementError } from '@/lib/billing/errors';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import { CopyTicketLink } from '@/components/helphub/copy-ticket-link';

const baseUrl =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : '';

export default async function HelpHubSetupPage() {
  const ctx = await getServerContextOrThrow();
  const pathname = (await headers()).get('x-pathname') ?? '/app/helphub/setup';

  try {
    await requirePermission({
      orgId: ctx.orgId,
      userId: ctx.userId,
      permission: 'dashboard.exec',
      pathname,
    });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    throw e;
  }

  try {
    await requireEntitlement({
      orgId: ctx.orgId,
      userId: ctx.userId,
      moduleKey: 'helphubqr',
      pathname,
    });
  } catch (e) {
    if (isEntitlementError(e)) {
      const from = encodeURIComponent(pathname || '/app/helphub/setup');
      redirect(`/app/upgrade?module=helphubqr&from=${from}`);
    }
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name, address_line1, city, state')
    .eq('org_id', ctx.orgId)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/helphub">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            HelpHub QR — Create QR codes by service address
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate a unique QR code and ticket link for each service address. Staff or guests can scan to submit housekeeping or service requests.
          </p>
        </div>
      </div>

      {!baseUrl && (
        <p className="text-amber-600 dark:text-amber-400 text-sm">
          Set <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_APP_URL</code> in
          your environment so ticket links use your app URL.
        </p>
      )}

      {facilities && facilities.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {facilities.map((fac) => {
            const ticketUrl = baseUrl ? `${baseUrl}/ticket/${fac.id}` : `[APP_URL]/ticket/${fac.id}`;
            const qrSrc = `/api/qr?facility=${fac.id}`;
            const addressLine = [fac.address_line1, fac.city, fac.state].filter(Boolean).join(', ');
            return (
              <Card key={fac.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>{fac.name}</CardTitle>
                  </div>
                  {addressLine && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {addressLine}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Ticket URL:</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded break-all">
                      {ticketUrl}
                    </code>
                    <CopyTicketLink url={ticketUrl} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">QR code</p>
                    <div className="inline-block p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc}
                        alt={`QR for ${fac.name}`}
                        width={140}
                        height={140}
                        className="block"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Print or display at this service address so staff or guests can scan to submit a housekeeping or service request.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-gray-600 dark:text-gray-400">
            <p>No service addresses yet. Add accounts and service addresses first, then return here to generate QR codes and ticket links.</p>
            <Link href="/app/sites">
              <Button variant="secondary" className="mt-4">
                Go to service addresses
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
