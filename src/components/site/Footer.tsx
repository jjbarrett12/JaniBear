'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FOOTER_COLUMNS } from './footer-links';
import { Button } from '@/components/ui/button';

const BRAND_TAGLINE = 'The operating system for commercial cleaning. Win bids. Keep accounts. Catch margin leaks.';

export function Footer() {
  return (
    <footer
      className="relative border-t border-white/[0.06] bg-zinc-950/95 text-zinc-400"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Tier 1: CTA bar */}
      <div className="border-b border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 sm:flex-row md:py-10">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-lg font-semibold text-white">
              Ready to run your cleaning business in one place?
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              Get a private demo or find the right plan.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-cyan-500 font-semibold text-white hover:bg-cyan-400"
            >
              <Link href="/demo">Get a Private Demo</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/pricing">See Plans</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Tier 2: Columns */}
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded">
              <Image
                src="/logo.png"
                alt="JANIBEAR"
                width={200}
                height={66}
                className="h-12 w-auto object-contain md:h-14"
                unoptimized
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm text-zinc-500 leading-relaxed">
              {BRAND_TAGLINE}
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {column.heading}
              </h4>
              <ul className="mt-4 space-y-3" role="list">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 3: Bottom bar */}
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} JANIBEAR. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-zinc-500 transition-colors hover:text-white focus:outline-none focus-visible:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-zinc-500 transition-colors hover:text-white focus:outline-none focus-visible:underline"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
