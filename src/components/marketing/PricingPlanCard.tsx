'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PricingPlan } from '@/lib/pricing';

interface PricingPlanCardProps {
  plan: PricingPlan;
}

export function PricingPlanCard({ plan }: PricingPlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-white/5 p-8 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 md:p-10 hover:border-indigo-500/40 hover:shadow-lg ${
        plan.mostPopular
          ? 'md:scale-[1.03] border-indigo-500/60 shadow-indigo-500/20'
          : 'border-white/10'
      }`}
    >
      {plan.mostPopular && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">
              Most Popular
            </span>
          </div>
        </>
      )}

      <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
        {plan.label}
      </p>
      <h3 className="mt-2 font-heading text-2xl font-semibold text-white md:text-3xl">
        {plan.name}
      </h3>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-heading text-4xl font-bold tabular-nums text-white md:text-5xl">
          {plan.price}
        </span>
        <span className="text-sm text-zinc-400">{plan.suffix}</span>
      </div>

      <ul className="mt-8 flex-1 space-y-3" role="list">
        {plan.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
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
              ? 'landing-cta text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.5)]'
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
