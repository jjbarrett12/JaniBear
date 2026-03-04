'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, QrCode } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  'Field + client QR submissions',
  'Auto-creates ops tasks',
  'Proof-of-response logs',
];

export function HelpHubQRUpsell() {
  return (
    <Card className="overflow-hidden border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40">
      <CardHeader className="border-b border-white/10 py-3 px-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/90 mb-1.5">CLIENT EXPERIENCE</p>
        <div className="flex items-center gap-2">
          <QrCode className="h-3.5 w-3.5 text-emerald-500/80" />
          <h3 className="text-sm font-semibold text-white">HelpHubQR</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          QR issue reporting → ops tasks. $29/company/month (Cub & Grizzly). Kodiak: included.
        </p>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <ul className="space-y-3 text-xs text-zinc-400">
          {FEATURES.map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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
