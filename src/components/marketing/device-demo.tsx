'use client';

import Link from 'next/link';

/**
 * MacBook and iPhone mockups demonstrating the software.
 * Screen content is a simplified placeholder suggesting dashboard (desktop) and tasks (mobile).
 */
export function DeviceDemo() {
  return (
    <section className="py-16 md:py-24 border-t border-zinc-800/80 bg-zinc-900/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight">
            See the software in action
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            One platform on desktop and mobile—schedules, task lists, inspections, and quality control where your team works.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-6xl mx-auto">
          {/* MacBook mockup */}
          <div className="relative flex-shrink-0" style={{ width: 'min(100%, 560px)' }}>
            <div className="relative bg-zinc-800 rounded-t-[14px] rounded-b-[6px] p-2 shadow-2xl border border-zinc-700">
              {/* Screen bezel */}
              <div className="aspect-[16/10] rounded-t-[8px] overflow-hidden bg-zinc-900 border border-zinc-700">
                {/* Placeholder app UI: sidebar + main */}
                <div className="h-full flex">
                  <div className="w-16 bg-zinc-800/80 border-r border-zinc-700 flex flex-col items-center py-3 gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-700" />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="h-4 w-32 bg-zinc-700 rounded mb-4" />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/80 border border-zinc-700">
                          <div className="w-8 h-8 rounded bg-zinc-600" />
                          <div className="flex-1">
                            <div className="h-3 w-3/4 bg-zinc-600 rounded mb-2" />
                            <div className="h-2 w-1/2 bg-zinc-700 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Base */}
              <div className="h-3 rounded-b-[4px] bg-zinc-700 -mx-1 mt-1" />
              <div className="h-2 rounded-full bg-zinc-800 w-24 mx-auto -mt-1.5" />
            </div>
          </div>

          {/* iPhone mockup */}
          <div className="relative flex-shrink-0" style={{ width: 'min(100%, 280px)' }}>
            <div className="relative bg-zinc-800 rounded-[2.5rem] p-2 shadow-2xl border border-zinc-700">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 rounded-full z-10" />
              {/* Screen */}
              <div className="aspect-[9/19] rounded-[2rem] overflow-hidden bg-zinc-900 border border-zinc-700">
                <div className="h-full flex flex-col p-4 pt-8">
                  <div className="h-6 w-24 bg-zinc-700 rounded mb-4" />
                  <div className="space-y-2 flex-1">
                    {['Location A', 'Location B', 'Location C'].map((label, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/80 border border-zinc-700">
                        <div className="w-5 h-5 rounded border-2 border-zinc-600" />
                        <div className="flex-1 min-w-0">
                          <div className="h-2.5 bg-zinc-600 rounded w-full mb-1" />
                          <div className="h-2 bg-zinc-700 rounded w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500 mt-8">
          Dashboard and task lists in real time—<Link href="/auth/signup" className="text-orange-400 hover:underline">try it free</Link>
        </p>
      </div>
    </section>
  );
}
