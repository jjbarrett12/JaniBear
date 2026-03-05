import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import { requirePermission } from '@/lib/auth/requirePermission';
import { requireEntitlement } from '@/lib/billing/requireEntitlement';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { isEntitlementError } from '@/lib/billing/errors';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, QrCode } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HelpHubQRPage() {
  const ctx = await getServerContextOrThrow();
  const pathname = (await headers()).get('x-pathname') ?? '/app/helphub';

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
      const from = encodeURIComponent(pathname || '/app/helphub');
      redirect(`/app/upgrade?module=helphubqr&from=${from}`);
    }
    redirect('/app/authz-error');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">HelpHubQR</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customer ticketing — view requests and set up a ticket link or QR per location
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/app/tickets">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ticket className="h-6 w-6 text-primary" />
                <CardTitle>View tickets</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See and manage all service tickets from your locations. Filter by status or location.
              </p>
              <Button variant="secondary" className="mt-4">
                Open tickets
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/helphub/setup">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <CardTitle>Setup by customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a unique ticket link and QR code for each location so customers can submit requests.
              </p>
              <Button variant="secondary" className="mt-4">
                Setup by location
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
