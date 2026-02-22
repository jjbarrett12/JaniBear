'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import type { StrategicTimeframe } from '@/lib/kpi-metrics';
import {
  getExecutiveSnapshot,
  getAttentionAlerts,
  getSalesEngineMetrics,
  getOpportunitiesByStage,
  getOperationalHealth,
  getCrewPerformance,
} from '@/lib/kpi-strategic-data';

export type KpiData = {
  timeframe: StrategicTimeframe;
  setTimeframe: (t: StrategicTimeframe) => void;
  executiveCards: ReturnType<typeof getExecutiveSnapshot>;
  attentionAlerts: ReturnType<typeof getAttentionAlerts>;
  salesMetrics: ReturnType<typeof getSalesEngineMetrics>;
  opportunitiesByStage: ReturnType<typeof getOpportunitiesByStage>;
  opsHealth: ReturnType<typeof getOperationalHealth>;
  crewMetrics: ReturnType<typeof getCrewPerformance>;
};

const KpiDataContext = createContext<KpiData | null>(null);

export function KpiDataProvider({ children }: { children: ReactNode }) {
  const [timeframe, setTimeframe] = useState<StrategicTimeframe>('90d');
  const executiveCards = useMemo(() => getExecutiveSnapshot(timeframe), [timeframe]);
  const attentionAlerts = useMemo(() => getAttentionAlerts(), []);
  const salesMetrics = useMemo(() => getSalesEngineMetrics(timeframe), [timeframe]);
  const opportunitiesByStage = useMemo(() => getOpportunitiesByStage(), []);
  const opsHealth = useMemo(() => getOperationalHealth(timeframe), [timeframe]);
  const crewMetrics = useMemo(() => getCrewPerformance(timeframe), [timeframe]);

  const value: KpiData = {
    timeframe,
    setTimeframe,
    executiveCards,
    attentionAlerts,
    salesMetrics,
    opportunitiesByStage,
    opsHealth,
    crewMetrics,
  };

  return (
    <KpiDataContext.Provider value={value}>
      {children}
    </KpiDataContext.Provider>
  );
}

export function useKpiData(): KpiData {
  const ctx = useContext(KpiDataContext);
  if (!ctx) throw new Error('useKpiData must be used inside KpiDataProvider');
  return ctx;
}
