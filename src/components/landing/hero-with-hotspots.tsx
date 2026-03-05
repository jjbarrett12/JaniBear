'use client';

import { useState } from 'react';
import { HeroCenterImage } from './hero-center-image';

/** Percent of container: [left, top] and size [width, height]. Laptop screen area is roughly center of image. */
const HOTSPOTS = [
  { id: 'pipeline', position: [42, 28] as const, tooltip: 'Deal pipeline' },
  { id: 'health', position: [52, 38] as const, tooltip: 'Account health' },
  { id: 'today', position: [48, 52] as const, tooltip: "Today's command center" },
];

export function HeroWithHotspots() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="relative inline-block">
      <div className="relative drop-shadow-[0_8px_48px_rgba(0,0,0,0.5)] leading-[0]">
        <HeroCenterImage />
      </div>
      {/* Hotspots overlay — only on desktop (hover), hidden on touch */
      HOTSPOTS.map(({ id, position: [left, top], tooltip }) => (
        <div
          key={id}
          className="absolute hidden md:block w-[12%] h-[14%] rounded-full cursor-default"
          style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
          onMouseEnter={() => setActive(id)}
          onMouseLeave={() => setActive(null)}
          role="img"
          aria-label={tooltip}
        >
          <span
            className="absolute inset-0 rounded-full border border-white/20 bg-white/5 ring-2 ring-white/10 ring-offset-2 ring-offset-transparent transition-all duration-200 hover:border-indigo-400/40 hover:bg-indigo-500/10 hover:ring-indigo-400/20"
            aria-hidden
          />
          {active === id && (
            <span
              className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1.5 text-xs font-medium text-zinc-200 shadow-xl backdrop-blur-sm"
              style={{ pointerEvents: 'none' }}
            >
              {tooltip}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
