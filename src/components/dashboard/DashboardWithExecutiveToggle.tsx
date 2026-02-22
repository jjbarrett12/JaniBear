'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { ExecutiveView } from './ExecutiveView';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';
import { setExecutiveMode } from '@/actions/executive-mode';
import type { WidgetDefinition } from '@/lib/widgets/types';
import { LayoutGrid, Sparkles } from 'lucide-react';

export function DashboardWithExecutiveToggle({
  orgId,
  initialExecutiveMode,
  isExecutiveEligible,
  widgetGridProps,
}: {
  orgId: string;
  initialExecutiveMode: boolean;
  isExecutiveEligible: boolean;
  widgetGridProps: {
    moduleKey: string;
    widgets: WidgetDefinition[];
    role?: string | null;
    roleEnum?: string | null;
    isAdmin?: boolean;
  };
}) {
  const [executiveMode, setExecutiveModeState] = useState(initialExecutiveMode);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const next = !executiveMode;
    startTransition(async () => {
      const { error } = await setExecutiveMode(orgId, next);
      if (!error) setExecutiveModeState(next);
    });
  };

  if (!isExecutiveEligible) {
    return (
      <WidgetGrid
        moduleKey={widgetGridProps.moduleKey}
        orgId={orgId}
        widgets={widgetGridProps.widgets}
        role={widgetGridProps.role}
        roleEnum={widgetGridProps.roleEnum}
        header={null}
        isAdmin={widgetGridProps.isAdmin}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={executiveMode ? 'secondary' : 'outline'}
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="gap-2"
        >
          {executiveMode ? (
            <>
              <Sparkles className="h-4 w-4" />
              Executive mode
            </>
          ) : (
            <>
              <LayoutGrid className="h-4 w-4" />
              Full dashboard
            </>
          )}
        </Button>
        <span className="text-xs text-muted-foreground">
          {executiveMode ? 'Simplified view · no editing' : 'Switch to simplified view'}
        </span>
      </div>

      {executiveMode ? (
        <ExecutiveView />
      ) : (
        <WidgetGrid
          moduleKey={widgetGridProps.moduleKey}
          orgId={orgId}
          widgets={widgetGridProps.widgets}
          role={widgetGridProps.role}
          roleEnum={widgetGridProps.roleEnum}
          header={null}
          isAdmin={widgetGridProps.isAdmin}
        />
      )}
    </div>
  );
}
