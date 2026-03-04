'use client';

import { CommandPalette } from '@/components/app/command-palette';
import { AppContextHeader } from '@/components/app/app-context-header';
import { ImpersonationBanner } from '@/components/platform/impersonation-banner';
import type { NavAlertCounts } from '@/actions/nav-alerts';

export function AppMainWithHeader({
  orgName,
  navAlerts,
  impersonatingOrgName,
  children,
}: {
  orgName: string | null;
  navAlerts?: NavAlertCounts | null;
  impersonatingOrgName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <CommandPalette />
      <main className="lg:pl-56 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen flex flex-col">
        <AppContextHeader orgName={orgName} navAlerts={navAlerts} />
        {impersonatingOrgName ? (
          <ImpersonationBanner orgName={impersonatingOrgName} />
        ) : null}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-w-0">
          {children}
        </div>
      </main>
    </>
  );
}
