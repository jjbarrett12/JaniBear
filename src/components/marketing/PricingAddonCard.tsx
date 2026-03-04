'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricingAddon } from '@/lib/pricing';

interface PricingAddonCardProps {
  addon: PricingAddon;
}

export function PricingAddonCard({ addon }: PricingAddonCardProps) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-lg md:p-8">
      {addon.badge && (
        <span className="absolute right-5 top-5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          {addon.badge}
        </span>
      )}

      <h3 className="font-heading text-xl font-semibold text-white pr-20">
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
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <Check className="h-2.5 w-2.5" strokeWidth={2.5} aria-hidden />
            </span>
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
