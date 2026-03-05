'use client';

import { Shield, Building2, Zap } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: Building2, label: 'Built for operators' },
  { icon: Shield, label: 'Enterprise-ready' },
  { icon: Zap, label: 'Same-day setup' },
] as const;

export function HeroTrustBar() {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
      role="list"
      aria-label="Category proof"
    >
      {TRUST_ITEMS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-2 text-zinc-400"
          role="listitem"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-medium text-zinc-400">{label}</span>
        </div>
      ))}
    </div>
  );
}
