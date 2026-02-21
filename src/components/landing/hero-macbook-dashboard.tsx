'use client';

import Image from 'next/image';
import {
  MapPin,
  ClipboardCheck,
  AlertCircle,
  Users,
  CalendarDays,
  LayoutGrid,
  FileCheck,
} from 'lucide-react';

/**
 * MacBook-style frame showing the current admin dashboard.
 * Uses /hero-dashboard.png if present, otherwise renders a static mock that matches the app dashboard layout.
 */
export function HeroMacbookDashboard() {
  const useImage = false; // Set true and add public/hero-dashboard.png to use a screenshot

  return (
    <div className="relative flex-shrink-0">
      <div className="absolute -inset-4 bg-amber-400/20 rounded-[2rem] blur-2xl" aria-hidden />
      {/* MacBook frame: notch, screen, base */}
      <div
        className="relative overflow-hidden rounded-[14px] border border-zinc-600/90 bg-zinc-800 shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(251,191,36,0.12)' }}
      >
        {/* Top notch (MacBook Pro style) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-20 h-5 rounded-b-full bg-zinc-900 border border-t-0 border-zinc-600/80" />
        {/* Screen bezel */}
        <div className="relative rounded-t-[10px] overflow-hidden border border-zinc-600/80 bg-zinc-900">
          <div className="aspect-[16/10] w-[300px] sm:w-[360px] md:w-[420px]">
            {useImage ? (
              <Image
                src="/hero-dashboard.png"
                alt="JANIBEAR admin dashboard"
                width={840}
                height={525}
                className="h-full w-full object-cover object-top"
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-zinc-950 p-2 sm:p-3 flex flex-col">
                {/* App chrome / sidebar hint */}
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/90" />
                    <span className="w-2 h-2 rounded-full bg-amber-500/90" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500/90" />
                  </div>
                  <span className="text-[9px] font-medium text-zinc-500 ml-1">Dashboard</span>
                </div>
                {/* Dashboard mock: header + stats + chart */}
                <div className="flex-1 min-h-0 pt-1.5 overflow-hidden">
                  <div className="mb-1.5">
                    <p className="text-[10px] sm:text-xs font-semibold text-white">Good morning, Alex</p>
                    <p className="text-[9px] text-zinc-500">Here&apos;s what&apos;s happening with your business today.</p>
                  </div>
                  {/* Stat cards row */}
                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-2">
                    {[
                      { icon: MapPin, label: 'Sites', value: '12', color: 'from-cyan-500 to-blue-600' },
                      { icon: ClipboardCheck, label: 'Inspections', value: '24', color: 'from-emerald-500 to-green-600' },
                      { icon: AlertCircle, label: 'Open Issues', value: '3', color: 'from-red-500 to-rose-600' },
                      { icon: Users, label: 'Crews', value: '8', color: 'from-violet-500 to-purple-600' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div
                        key={label}
                        className="rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 sm:p-2"
                      >
                        <div className={`inline-flex p-1 rounded-md bg-gradient-to-br ${color} mb-0.5`}>
                          <Icon className="h-2.5 w-2.5 text-white" />
                        </div>
                        <p className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-wide">{label}</p>
                        <p className="text-xs sm:text-sm font-bold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Chart + Quick actions */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 sm:p-2">
                      <p className="text-[8px] sm:text-[9px] text-zinc-500 mb-1">Inspections (30d)</p>
                      <div className="flex items-end gap-0.5 h-8">
                        {[40, 65, 45, 80, 55, 70, 85].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-amber-500/80 to-amber-400/60 min-h-[2px]"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/90 p-1.5 sm:p-2">
                      <p className="text-[8px] sm:text-[9px] text-zinc-500 mb-1">Quick actions</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-700/80 text-[8px] text-zinc-300">
                          <CalendarDays className="h-2.5 w-2.5" /> Schedule
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-700/80 text-[8px] text-zinc-300">
                          <FileCheck className="h-2.5 w-2.5" /> Inspect
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-700/80 text-[8px] text-zinc-300">
                          <LayoutGrid className="h-2.5 w-2.5" /> Tasks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* MacBook base */}
        <div className="h-2 sm:h-2.5 rounded-b-[6px] bg-gradient-to-b from-zinc-600 to-zinc-700 border border-t-0 border-zinc-600/80" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-1 rounded-b-full bg-zinc-800 border border-t-0 border-zinc-600/60" />
      </div>
    </div>
  );
}
