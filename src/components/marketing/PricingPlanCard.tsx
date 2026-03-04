'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricingPlan } from '@/lib/pricing';

interface PricingPlanCardProps {
  plan: PricingPlan;
}

export function PricingPlanCard({ plan }: PricingPlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white/5 p-8 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:shadow-xl md:p-10 ${
        plan.mostPopular
          ? 'border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.12)]'
          : 'border-white/10'
      }`}
    >
      {plan.mostPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Most Popular
          </span>
        </div>
      )}

      <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        {plan.label}
      </p>
      <h3 className="mt-2 font-heading text-2xl font-bold text-white md:text-3xl">
        {plan.name}
      </h3>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-heading text-4xl font-bold tabular-nums text-white md:text-5xl">
          {plan.price}
        </span>
        <span className="text-sm text-zinc-400">{plan.suffix}</span>
      </div>

      <ul className="mt-8 flex-1 space-y-4" role="list">
        {plan.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3 text-sm text-zinc-300">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </span>
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <Button
          asChild
          size="lg"
          className={`w-full rounded-xl font-semibold ${
            plan.mostPopular
              ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
              : 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
          }`}
        >
          <Link href={plan.ctaHref}>{plan.cta}</Link>
        </Button>
        <p className="text-center text-xs text-zinc-500">
          Billed monthly • Cancel anytime
        </p>
      </div>
    </div>
  );
}
