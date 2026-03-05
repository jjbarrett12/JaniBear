'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SiteProfitabilityRow } from '@/lib/financial-health-mock';
import { AppLink } from '@/components/app/app-link';
import { appRoutes } from '@/lib/routes';

interface SiteFinanceDrawerProps {
  site: SiteProfitabilityRow | null;
  onClose: () => void;
}

export function SiteFinanceDrawer({ site, onClose }: SiteFinanceDrawerProps) {
  if (!site) return null;

  return (
    <aside className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-border bg-card shadow-lg">
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{site.clientName}</p>
          <h2 className="text-base font-semibold text-foreground">{site.siteName}</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Revenue trend
          </h3>
          <p className="text-sm text-muted-foreground">Small chart placeholder — wire to site-level revenue API.</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Labor hours vs estimate
          </h3>
          <p className="text-sm text-muted-foreground">Bar placeholder — labor vs bid/contract estimate.</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Supplies spend trend
          </h3>
          <p className="text-sm text-muted-foreground">Trend placeholder — supplies by period.</p>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Notes / tags
          </h3>
          <p className="text-sm text-muted-foreground">{site.whyTag ?? '—'}</p>
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Linked context
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" asChild>
              <AppLink href={appRoutes.site(site.siteId)}>View site</AppLink>
            </Button>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              View contract scope
            </Button>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              View ops issues
            </Button>
          </div>
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Create price increase draft
            </Button>
            <Button variant="outline" size="sm" className="text-xs" disabled>
              Create re-scope checklist
            </Button>
          </div>
        </section>
      </div>
    </aside>
  );
}
