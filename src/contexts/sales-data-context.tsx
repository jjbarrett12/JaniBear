'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type Lead = {
  id: string;
  contact_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at?: string;
};

export type SalesData = {
  leads: Lead[];
  byStage: Record<string, Lead[]>;
};

const SalesDataContext = createContext<SalesData | null>(null);

export function SalesDataProvider({
  data,
  children,
}: {
  data: SalesData;
  children: ReactNode;
}) {
  return (
    <SalesDataContext.Provider value={data}>
      {children}
    </SalesDataContext.Provider>
  );
}

export function useSalesData(): SalesData {
  const ctx = useContext(SalesDataContext);
  if (!ctx) throw new Error('useSalesData must be used inside SalesDataProvider');
  return ctx;
}
