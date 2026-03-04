'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

const pricingExample = {
  product: 'Nitrile Gloves – 5mil',
  retail: 89,
  member: 64,
};

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function savingsPercent(retail: number, member: number) {
  if (retail <= 0) return 0;
  return Math.round(((retail - member) / retail) * 100);
}

const BENEFITS = [
  'Direct-from-manufacturer pricing',
  'No distributor markup layers',
  'Auto-reorder pricing protection',
  'Exclusive SKUs negotiated for members',
];

export function MemberBuyingPower() {
  const { product, retail, member } = pricingExample;
  const savings = savingsPercent(retail, member);

  return (
    <section
      className="relative bg-zinc-50 dark:bg-zinc-900 overflow-hidden"
      aria-labelledby="member-buying-power-heading"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-100/20 dark:via-zinc-800/10 to-transparent pointer-events-none" aria-hidden />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-20 items-center">
          {/* Left column */}
          <div className="lg:col-span-3">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Member Supply Network
            </p>
            <h2
              id="member-buying-power-heading"
              className="text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-foreground max-w-xl"
            >
              National contract pricing.
              <br />
              Private buying network.
            </h2>
            <p className="mt-8 text-lg text-muted-foreground/90 max-w-lg leading-[1.6]">
              Through direct manufacturer relationships, JANIBEAR members access volume-tier pricing on gloves, chemicals, PPE, and equipment — without truckload minimums.
            </p>
            <ul className="mt-12 space-y-4">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-400/80 dark:bg-zinc-500/80" aria-hidden />
                  <span className="text-muted-foreground text-[15px] leading-snug">{benefit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-14 flex flex-wrap gap-4">
              <Button asChild size="lg" className="font-medium">
                <Link href="/demo">Request access</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-medium">
                <Link href="/app/pro-gear">View catalog</Link>
              </Button>
            </div>
          </div>

          {/* Right column – pricing card with elevation */}
          <div className="lg:col-span-2">
            <div className="relative">
              {/* Atmospheric glow behind card */}
              <div
                className="absolute -inset-px rounded-2xl opacity-60 dark:opacity-40 pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(161,161,170,0.25) 0%, transparent 70%)',
                }}
                aria-hidden
              />
              <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/95 shadow-sm p-9 lg:p-10">
                <p className="text-sm font-medium text-foreground/90">{product}</p>

                <div className="mt-8 pt-7 border-t border-zinc-200 dark:border-zinc-700/80">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                    Market reference
                  </p>
                  <p className="mt-1.5 text-base text-muted-foreground/70 line-through decoration-muted-foreground/50 decoration-1">
                    {formatPrice(retail)} / case
                  </p>
                </div>

                <div className="mt-8 pt-7 border-t border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">
                        Member contract price
                      </p>
                      <p className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                        {formatPrice(member)} / case
                      </p>
                      <p className="mt-2.5 text-xs text-muted-foreground/80">
                        Locked for active members
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-600/80 bg-zinc-50 dark:bg-zinc-700/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {savings}% below market
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
