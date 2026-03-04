'use client';

import { RevenuePulseCard } from '@/components/dashboard/RevenuePulseCard';
import { RiskAlertCard } from '@/components/dashboard/RiskAlertCard';
import { CrewStatusCard } from '@/components/dashboard/CrewStatusCard';
import { AccountHealthCard } from '@/components/dashboard/AccountHealthCard';
import { QualitySnapshotCard } from '@/components/dashboard/QualitySnapshotCard';
import { ARSnapshotCard } from '@/components/dashboard/ARSnapshotCard';
import { PipelineSnapshotCard } from '@/components/dashboard/PipelineSnapshotCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { useDashboardData } from '@/contexts/dashboard-data-context';
import type { WidgetDefinition } from '../types';
import { DollarSign, AlertTriangle, Users, Heart, ClipboardCheck, Receipt, TrendingUp, Sparkles } from 'lucide-react';

function RevenuePulseWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <RevenuePulseCard data={data.revenue} />;
}
function RiskAlertWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <RiskAlertCard data={data.risk} />;
}
function CrewStatusWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <CrewStatusCard data={data.crew} />;
}
function AccountHealthWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <AccountHealthCard data={data.accountHealth} />;
}
function QualitySnapshotWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <QualitySnapshotCard data={data.quality} />;
}
function ARSnapshotWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <ARSnapshotCard data={data.ar} />;
}
function PipelineSnapshotWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <PipelineSnapshotCard data={data.pipeline} />;
}
function AIInsightWidget({ orgId: _orgId }: { orgId: string }) {
  const data = useDashboardData();
  return <AIInsightCard data={data.ai} />;
}

export const dashboardWidgetRegistry: WidgetDefinition[] = [
  {
    id: 'revenue_pulse',
    title: 'Revenue Pulse',
    description: 'Today, WTD, and month pacing',
    icon: <DollarSign className="h-4 w-4" />,
    component: RevenuePulseWidget,
    default: {
      lg: { x: 0, y: 0, w: 1, h: 1 },
      md: { x: 0, y: 0, w: 1, h: 1 },
      sm: { x: 0, y: 0, w: 1, h: 1 },
    },
    minW: 1,
    minH: 1,
  },
  {
    id: 'risk_alert',
    title: 'Operational Risk',
    description: 'Accounts needing attention',
    icon: <AlertTriangle className="h-4 w-4" />,
    component: RiskAlertWidget,
    default: { lg: { x: 1, y: 0, w: 1, h: 1 }, md: { x: 1, y: 0, w: 1, h: 1 }, sm: { x: 0, y: 1, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'crew_status',
    title: 'Crew Status',
    description: 'Crews and jobs',
    icon: <Users className="h-4 w-4" />,
    component: CrewStatusWidget,
    default: { lg: { x: 2, y: 0, w: 1, h: 1 }, md: { x: 0, y: 1, w: 1, h: 1 }, sm: { x: 0, y: 2, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'account_health',
    title: 'Account Health',
    description: 'Health distribution and visits due',
    icon: <Heart className="h-4 w-4" />,
    component: AccountHealthWidget,
    default: { lg: { x: 3, y: 0, w: 1, h: 1 }, md: { x: 1, y: 1, w: 1, h: 1 }, sm: { x: 0, y: 3, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'quality_snapshot',
    title: 'Quality Snapshot',
    description: 'Inspections and scores',
    icon: <ClipboardCheck className="h-4 w-4" />,
    component: QualitySnapshotWidget,
    default: { lg: { x: 0, y: 1, w: 1, h: 1 }, md: { x: 0, y: 2, w: 1, h: 1 }, sm: { x: 0, y: 4, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'ar_snapshot',
    title: 'AR Snapshot',
    description: 'Outstanding and overdue',
    icon: <Receipt className="h-4 w-4" />,
    component: ARSnapshotWidget,
    default: { lg: { x: 1, y: 1, w: 1, h: 1 }, md: { x: 1, y: 2, w: 1, h: 1 }, sm: { x: 0, y: 5, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'pipeline_snapshot',
    title: 'Pipeline Snapshot',
    description: 'Bids and follow-ups',
    icon: <TrendingUp className="h-4 w-4" />,
    component: PipelineSnapshotWidget,
    default: { lg: { x: 2, y: 1, w: 1, h: 1 }, md: { x: 0, y: 3, w: 1, h: 1 }, sm: { x: 0, y: 6, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
  {
    id: 'ai_insight',
    title: 'AI Performance',
    description: 'AI alerts and monitoring',
    icon: <Sparkles className="h-4 w-4" />,
    component: AIInsightWidget,
    default: { lg: { x: 3, y: 1, w: 1, h: 1 }, md: { x: 1, y: 3, w: 1, h: 1 }, sm: { x: 0, y: 7, w: 1, h: 1 } },
    minW: 1,
    minH: 1,
  },
];
