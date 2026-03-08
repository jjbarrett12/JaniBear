import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import { requirePermission } from '@/lib/auth/requirePermission';
import { hasEntitlement } from '@/lib/billing/requireEntitlement';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
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

  const hasHelpHub = await hasEntitlement(ctx.orgId, ctx.userId, 'helphubqr');
  const setupHref = hasHelpHub ? '/app/helphub/setup' : `/app/upgrade?module=helphubqr&from=${encodeURIComponent(pathname || '/app/helphub')}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">HelpHub QR</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Create QR codes for your service addresses so staff or guests in hotels and large facilities can scan to request housekeeping or cleaning help.
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
                See and manage service requests from QR scans. Filter by status or service address.
              </p>
              <Button variant="secondary" className="mt-4">
                Open tickets
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={setupHref}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" />
                <CardTitle>Create QR codes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasHelpHub
                  ? 'Generate a unique QR code and ticket link for each service address. Print or display so guests can scan to submit requests.'
                  : 'Add HelpHub QR to your plan to generate QR codes per service address for housekeeping and service requests.'}
              </p>
              <Button variant="secondary" className="mt-4">
                {hasHelpHub ? 'Set up by service address' : 'Add to plan'}
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
