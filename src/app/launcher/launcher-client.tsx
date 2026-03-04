'use client';

import { useEffect } from 'react';

/**
 * Shown when user has exactly one org: brief "Opening workspace…" then redirect.
 */
export function LauncherClient({
  singleOrgUrl,
  orgName,
}: {
  singleOrgUrl: string;
  orgName: string;
}) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.href = singleOrgUrl;
    }, 800);
    return () => clearTimeout(t);
  }, [singleOrgUrl]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground animate-pulse">Opening workspace…</p>
        <p className="text-sm text-muted-foreground/80">{orgName}</p>
      </div>
    </div>
  );
}
