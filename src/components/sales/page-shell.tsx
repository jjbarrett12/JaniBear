'use client';

import { ReactNode } from 'react';

export function SalesPageShell({
  children,
  leftRail,
  breadcrumb,
}: {
  children: ReactNode;
  leftRail?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 flex-1 bg-background">
      {breadcrumb != null && (
        <nav className="shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/60 sm:px-6">
          {breadcrumb}
        </nav>
      )}
      <div className="flex flex-1 min-h-0">
        {leftRail != null && (
          <aside className="shrink-0 w-52 border-r border-border/60 overflow-y-auto hidden lg:block bg-card/30">
            {leftRail}
          </aside>
        )}
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
