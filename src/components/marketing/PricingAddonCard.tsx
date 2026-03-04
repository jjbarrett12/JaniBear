'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricingAddon } from '@/lib/pricing';

const ADDON_CATEGORY: Record<string, string> = {
  lidar: 'LIDAR ENGINE',
  'ai-proposal': 'AI AUTOMATION',
  helphub: 'CLIENT EXPERIENCE',
};

interface PricingAddonCardProps {
  addon: PricingAddon;
}

export function PricingAddonCard({ addon }: PricingAddonCardProps) {
  const category = addon.badge ?? ADDON_CATEGORY[addon.id] ?? 'ADD-ON';
  return (
    <div className="relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40 md:p-8">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400/90 mb-2">
        {category}
      </p>

      <h3 className="font-heading text-xl font-semibold text-white">
        {addon.name}
      </h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-heading text-3xl font-bold tabular-nums text-white">
          {addon.price}
        </span>
        <span className="text-sm text-zinc-400">{addon.suffix}</span>
      </div>

      <ul className="mt-6 flex-1 space-y-3" role="list">
        {addon.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            {bullet}
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-6 w-full rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10"
      >
        <Link href="/demo">Add to plan</Link>
      </Button>
    </div>
  );
}
