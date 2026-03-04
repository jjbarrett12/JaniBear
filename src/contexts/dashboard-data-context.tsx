'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { CommandCenterData } from '@/lib/command-center-data';

const DashboardDataContext = createContext<CommandCenterData | null>(null);

export function DashboardDataProvider({
  data,
  children,
}: {
  data: CommandCenterData;
  children: ReactNode;
}) {
  return (
    <DashboardDataContext.Provider value={data}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData(): CommandCenterData {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error('useDashboardData must be used inside DashboardDataProvider');
  return ctx;
}
