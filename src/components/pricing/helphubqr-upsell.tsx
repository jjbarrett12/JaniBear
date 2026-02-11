'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, QrCode } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  'Field + client QR submissions',
  'Auto-creates ops tasks',
  'Proof-of-response logs',
];

export function HelpHubQRUpsell() {
  return (
    <Card className="bg-zinc-900/40 border border-zinc-800 overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <QrCode className="h-3.5 w-3.5 text-emerald-500/80" />
          <h3 className="text-sm font-semibold text-white">HelpHubQR</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          QR issue reporting → ops tasks. $29/location (Cub & Grizzly). Kodiak: included.
        </p>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <ul className="space-y-1.5 text-xs text-zinc-400">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-3 w-3 text-emerald-500/70 flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" size="sm" className="w-full mt-3 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5">
          <Link href="/contact">Add HelpHubQR</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
