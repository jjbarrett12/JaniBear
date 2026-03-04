'use client';

import Link from 'next/link';
import { Building2, Users, Briefcase } from 'lucide-react';
import { HOMEPAGE } from '@/content/homepage';

const PERSONA_ICONS = [Building2, Users, Briefcase] as const;

export default function WhoItsForSection() {
  const { headline, subhead, personas } = HOMEPAGE.whoItsFor;
  return (
    <section
      id="who-its-for"
      className="relative py-16 md:py-24 bg-black border-t border-zinc-800/50"
      aria-labelledby="who-heading"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="who-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {headline}
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">{subhead}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, i) => {
            const Icon = PERSONA_ICONS[i] ?? Building2;
            const borderColors = ['border-amber-400/40', 'border-cyan-400/40', 'border-violet-400/40'];
            const accentColors = ['text-amber-400', 'text-cyan-400', 'text-violet-400'];
            return (
              <Link
                key={persona.name}
                href={persona.href}
                className={`rounded-2xl border ${borderColors[i]} bg-zinc-900/50 p-6 md:p-8 hover:shadow-lg transition-all flex flex-col`}
              >
                <div className={`w-12 h-12 rounded-xl border ${borderColors[i]} flex items-center justify-center mb-4 ${accentColors[i]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-white text-lg mb-2">{persona.name}</h3>
                <p className="text-zinc-400 text-sm flex-1">{persona.description}</p>
                <span className={`mt-4 inline-flex items-center text-sm font-medium ${accentColors[i]}`}>
                  Learn more
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
