'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const PLAN_IDS = ['cub', 'black-bear', 'grizzly', 'kodiak'] as const;
const PLAN_NAMES: Record<string, string> = {
  cub: 'Cub',
  'black-bear': 'Black Bear',
  grizzly: 'Grizzly',
  kodiak: 'Kodiak',
};

export function PricingSurveyCta() {
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
    if (hash && PLAN_IDS.includes(hash as (typeof PLAN_IDS)[number])) {
      setRecommendedPlan(hash);
      // Scroll to the plan card after a short delay so the DOM is ready
      const t = setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto mb-8 space-y-4">
      {recommendedPlan ? (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Your recommended plan</p>
              <p className="text-zinc-400 text-sm">
                Based on your survey: <span className="text-orange-400 font-medium">{PLAN_NAMES[recommendedPlan]}</span>
              </p>
            </div>
          </div>
          <a href={`#${recommendedPlan}`}>
            <Button size="sm" className="bg-orange-500 text-white hover:bg-orange-400 border-0">
              View plan
            </Button>
          </a>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-zinc-300 text-sm md:text-base">
          Not sure which plan fits? <span className="text-white font-medium">Take a 30-second survey</span> to see your recommended plan based on your business type and goals.
        </p>
        <Link href="/survey">
          <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white shrink-0">
            See my recommended plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
