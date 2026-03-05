import Link from 'next/link';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.9.12';

/**
 * Minimal SaaS-style system footer for the dashboard sidebar.
 * No marketing CTAs. Only version, system status, and legal links.
 */
export function SystemFooter() {
  return (
    <div
      className="border-t border-border px-3 py-3 text-xs text-muted-foreground"
      role="contentinfo"
      aria-label="System footer"
    >
      <div className="font-medium text-foreground/80">JANIBEAR v{APP_VERSION}</div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <Link href="/status" className="text-muted-foreground hover:text-foreground transition-colors">
          System Status
        </Link>
        <span className="text-muted-foreground/70" aria-hidden>•</span>
        <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
          Privacy
        </Link>
        <span className="text-muted-foreground/70" aria-hidden>•</span>
        <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}
