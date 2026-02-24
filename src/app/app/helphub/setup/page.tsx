import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { getEffectiveAccessForCurrentUser, hasFeature } from '@/lib/access';
import { FeatureGate } from '@/components/access/feature-gate';
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
  const org = await requireOrg();
  const access = await getEffectiveAccessForCurrentUser();
  const supabase = await createClient();

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, address, city, state')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <FeatureGate feature="helphub_qr" allowed={hasFeature(access, 'helphub_qr')} fallback={
      <div className="rounded-md border bg-card p-8 text-center max-w-lg mx-auto">
        <p className="text-muted-foreground mb-2">HelpHub QR is not enabled for your plan. Upgrade or enable the HelpHub QR add-on.</p>
        <p className="text-sm text-muted-foreground mb-6">
          HelpHub QR lets customers submit service requests via a unique link or QR code per location; submissions become ops tasks and you get proof-of-response logs.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/pricing">See plans & enable</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    }>
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/helphub">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            HelpHubQR — Setup by customer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Use the link or QR for each site so that customer can submit service requests
          </p>
        </div>
      </div>

      {!baseUrl && (
        <p className="text-amber-600 dark:text-amber-400 text-sm">
          Set <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">NEXT_PUBLIC_APP_URL</code> in
          your environment so ticket links use your app URL.
        </p>
      )}

      {locations && locations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc) => {
            const ticketUrl = baseUrl ? `${baseUrl}/ticket/${loc.id}` : `[APP_URL]/ticket/${loc.id}`;
            const qrSrc = `/api/qr?location=${loc.id}`;
            return (
              <Card key={loc.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle>{loc.name}</CardTitle>
                  </div>
                  {(loc.address || loc.city) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[loc.address, loc.city, loc.state].filter(Boolean).join(', ')}
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
                        alt={`QR for ${loc.name}`}
                        width={140}
                        height={140}
                        className="block"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Print or display at this site so visitors can scan to submit a request.
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
            <p>No sites yet. Add sites first, then return here to get ticket links and QR codes.</p>
            <Link href="/app/sites">
              <Button variant="secondary" className="mt-4">
                Go to Sites
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
    </FeatureGate>
  );
}
