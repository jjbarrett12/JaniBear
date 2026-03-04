'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scan, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  'LiDAR / RoomPlan capture for walkthroughs',
  'Site dimensions & scan storage',
  'Sales: accurate bids from real measurements',
  'Ops: proof-of-condition and scope verification',
];

export function LidarUpgrade() {
  return (
    <Card className="overflow-hidden border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40">
      <CardHeader className="border-b border-white/10 py-3 px-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/90 mb-1.5">LIDAR ENGINE</p>
        <div className="flex items-center gap-2">
          <Scan className="h-3.5 w-3.5 text-violet-500/80" />
          <h3 className="text-sm font-semibold text-white">LiDAR upgrade</h3>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Add LiDAR/RoomPlan to Sales walkthroughs or Ops inspections. Pricing by tier—contact us.
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
        <Button asChild variant="ghost" size="sm" className="w-full mt-3 text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/5">
          <Link href="/contact">Add LiDAR upgrade</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
