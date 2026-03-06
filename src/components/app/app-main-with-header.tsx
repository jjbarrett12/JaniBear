'use client';

import { CommandPalette } from '@/components/app/command-palette';
import { AppContextHeader } from '@/components/app/app-context-header';
import { ImpersonationBanner } from '@/components/platform/impersonation-banner';
import { TrialBanner } from '@/components/app/trial-banner';
import { PostTrialGate } from '@/components/app/post-trial-gate';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import type { OrganizationTrialState } from '@/lib/trial/getOrganizationTrialState';

export function AppMainWithHeader({
  orgName,
  navAlerts,
  impersonatingOrgName,
  trialState,
  children,
}: {
  orgName: string | null;
  navAlerts?: NavAlertCounts | null;
  impersonatingOrgName?: string | null;
  trialState?: OrganizationTrialState | null;
  children: React.ReactNode;
}) {
  const showTrialBanner = trialState?.subscriptionStatus === 'trial' && !trialState?.isExpired;
  const showPostTrialGate = trialState?.isExpired && trialState?.subscriptionStatus === 'past_due';

  return (
    <>
      <CommandPalette />
      <main className="lg:pl-56 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen flex flex-col">
        <AppContextHeader orgName={orgName} navAlerts={navAlerts} />
        {impersonatingOrgName ? (
          <ImpersonationBanner orgName={impersonatingOrgName} />
        ) : null}
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-w-0 space-y-4">
          {showTrialBanner && trialState && (
            <TrialBanner
              currentTrialDay={trialState.currentTrialDay}
              daysRemaining={trialState.daysRemaining}
              isExpired={trialState.isExpired}
              subscriptionStatus={trialState.subscriptionStatus}
            />
          )}
          {showPostTrialGate && (
            <PostTrialGate />
          )}
          <div className={showPostTrialGate ? 'opacity-90' : ''}>
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
