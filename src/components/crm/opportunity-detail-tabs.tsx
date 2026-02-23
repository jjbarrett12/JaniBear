'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Rocket } from 'lucide-react';

type TabId = 'overview' | 'launch_plan';

export function OpportunityDetailTabs({
  activeTab,
  overviewContent,
  launchPlanContent,
  showLaunchPlanTab = true,
}: {
  activeTab: TabId;
  overviewContent: React.ReactNode;
  launchPlanContent: React.ReactNode;
  showLaunchPlanTab?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setTab = (tab: TabId) => {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (tab === 'overview') p.delete('tab');
    else p.set('tab', tab);
    const q = p.toString();
    router.push(pathname + (q ? `?${q}` : ''));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTab('overview')}
        >
          <LayoutGrid className="mr-1.5 h-4 w-4" />
          Overview
        </Button>
        {showLaunchPlanTab && (
          <Button
            variant={activeTab === 'launch_plan' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('launch_plan')}
          >
            <Rocket className="mr-1.5 h-4 w-4" />
            Launch Plan
          </Button>
        )}
      </div>
      {activeTab === 'overview' && overviewContent}
      {activeTab === 'launch_plan' && launchPlanContent}
    </div>
  );
}
