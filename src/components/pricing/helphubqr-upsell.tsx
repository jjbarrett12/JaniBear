'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, QrCode } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  'QR codes by location/area',
  'Staff + client issue submission',
  'Auto-linked to Ops tasks',
  'Proof-of-response logs',
];

export function HelpHubQRUpsell() {
  return (
    <Card className="bg-zinc-900/80 border-emerald-400/40 border-2 overflow-hidden">
      <div className="bg-emerald-500/10 border-b border-emerald-400/20 px-4 py-2 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-300">Add-on</span>
      </div>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold text-white">HelpHubQR</h3>
        <p className="text-sm text-zinc-400">
          Frontline issue reporting via QR—no apps required.
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
              <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-white">$29</span>
            <span className="text-zinc-500">/location/month</span>
          </p>
          <p className="text-xs text-emerald-400/90 mt-1">
            or included free on Grizzly+ plans
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
        >
          <Link href="/contact">Add HelpHubQR</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
