'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPinned, Building2 } from 'lucide-react';
import { VerticalsManager } from './VerticalsManager';
import { RoutingRulesBuilder } from './RoutingRulesBuilder';
import { RepCapacitySection } from './RepCapacitySection';
import type { CoverageAdminData } from '@/lib/coverage/admin-data';

interface Props {
  orgId: string;
  initialData: CoverageAdminData;
}

export function CoverageAdminTabs({ orgId, initialData }: Props) {
  return (
    <Tabs defaultValue="sales" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="sales" className="gap-2">
          <MapPinned className="h-4 w-4" />
          Sales Coverage
        </TabsTrigger>
        <TabsTrigger value="ops" className="gap-2">
          <Building2 className="h-4 w-4" />
          Ops Coverage
        </TabsTrigger>
      </TabsList>
      <TabsContent value="sales" className="mt-4 space-y-8">
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          <p className="font-medium text-foreground">Sales coverage splits</p>
          <p className="mt-1 text-sm">
            Select a parent territory, draw coverage areas (splits), and assign reps. Use verticals and routing rules to assign leads by industry (e.g. all healthcare to Rep A).
          </p>
          <a href="/app/map?sales=true" className="mt-4 inline-block text-sm text-primary hover:underline">
            Open map →
          </a>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <VerticalsManager orgId={orgId} verticals={initialData.verticals} />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <RoutingRulesBuilder
            orgId={orgId}
            rules={initialData.rules}
            verticals={initialData.verticals}
            territories={initialData.territories}
            coverageAreas={initialData.coverageAreas}
            members={initialData.members}
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <RepCapacitySection
            orgId={orgId}
            capacitySettings={initialData.capacitySettings ?? null}
            repCounters={initialData.repCounters ?? []}
            repOverrides={initialData.repOverrides ?? []}
            members={initialData.members}
          />
        </div>
      </TabsContent>
      <TabsContent value="ops" className="mt-4">
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          <p className="font-medium text-foreground">Ops coverage</p>
          <p className="mt-1 text-sm">
            Define ops manager coverage areas and assign accounts/sites. Set territory parameters for assignment rules (primary / manual).
          </p>
          <p className="mt-3 text-sm">
            <strong>Coming soon:</strong> Ops coverage areas, ops_owner_user_id assignment from coverage.
          </p>
          <a href="/app/map?ops=true" className="mt-4 inline-block text-sm text-primary hover:underline">
            Open map →
          </a>
        </div>
      </TabsContent>
    </Tabs>
  );
}
