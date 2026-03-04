'use client';

import { ClipboardCheck, Target, LayoutDashboard } from 'lucide-react';

const FLOW = [
  { role: 'CREWS', tier: 'Cub', icon: ClipboardCheck },
  { role: 'SALES', tier: 'Grizzly', icon: Target },
  { role: 'OPERATIONS', tier: 'Kodiak', icon: LayoutDashboard },
] as const;

/**
 * Role flow diagram: Crews → Sales → Operations (Cub / Grizzly / Kodiak).
 * Decorative; not interactive to avoid misleading affordances.
 */
export function RoleFlow() {
  return (
    <div className="flex flex-col items-center gap-4 mt-8" aria-hidden>
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-center gap-4">
        {FLOW.map((item, i) => (
          <div key={item.role} className="flex items-center gap-4">
            <div
              className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 backdrop-blur hover:scale-[1.03] hover:border-indigo-500/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-zinc-400 shrink-0" aria-hidden />
                <span className="text-[11px] tracking-widest text-zinc-400 uppercase">
                  {item.role}
                </span>
              </div>
              <p className="text-lg font-semibold text-white mt-1">{item.tier}</p>
            </div>
            {i < FLOW.length - 1 && (
              <span className="text-zinc-500 text-xl" aria-hidden>
                →
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Mobile: vertical with arrows */}
      <div className="flex md:hidden flex-col items-center gap-3">
        {FLOW.map((item, i) => (
          <div key={item.role} className="flex flex-col items-center gap-3">
            <div
              className="bg-white/5 border border-white/10 rounded-xl px-6 py-4 backdrop-blur w-full max-w-[200px] text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <item.icon className="h-4 w-4 text-zinc-400 shrink-0" aria-hidden />
                <span className="text-[11px] tracking-widest text-zinc-400 uppercase">
                  {item.role}
                </span>
              </div>
              <p className="text-lg font-semibold text-white mt-1">{item.tier}</p>
            </div>
            {i < FLOW.length - 1 && (
              <span className="text-zinc-500 text-lg" aria-hidden>
                ↓
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
